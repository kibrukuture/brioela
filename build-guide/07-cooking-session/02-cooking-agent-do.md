# Cooking Session — CookingAgent Durable Object

## What This File Covers

CookingAgent DO class structure, all endpoints, in-memory state, initialization, Cloudflare Realtime stream handling, mobile audio-out WebSocket, DO eviction recovery, and Orchestrator tool forwarding.

---

## DO Identity and Scope

```
DO ID: env.COOKING_AGENT.idFromName(`cooking:${sessionId}`)
```

One DO per cooking session. Session-scoped — not user-scoped. The Orchestrator DO creates and addresses the CookingAgent. When the session ends, the CookingAgent DO is no longer addressed and Cloudflare eventually evicts it. All critical state is written to SQLite before eviction can matter.

---

## File Location

```
backend/src/agents/cooking/
├── cooking.agent.ts                 ← DO class
├── _handlers/
│   ├── init.handler.ts
│   ├── realtime-stream.handler.ts   ← Cloudflare Realtime WebSocket adapter
│   ├── mobile-audio.handler.ts      ← mobile receives Gemini audio here
│   ├── alarm.handler.ts             ← timer alarms
│   └── index.ts
├── proactive-speech/
│   ├── silence-tracker.ts
│   ├── visual-change-detector.ts
│   ├── adaptive-frequency.ts
│   ├── prompt-builder.ts
│   ├── response-filter.ts
│   ├── suppression-rules.ts
│   └── index.ts
└── index.ts
```

---

## DO Class

```typescript
// backend/src/agents/cooking/cooking.agent.ts

import { Agent } from '@cloudflare/agents'
import type { Env } from '@/types/env'
import { handleInit }           from './_handlers/init.handler'
import { handleRealtimeStream } from './_handlers/realtime-stream.handler'
import { handleMobileAudio }    from './_handlers/mobile-audio.handler'
import { handleAlarm }          from './_handlers/alarm.handler'

export class CookingAgent extends Agent<Env> {
  // In-memory state — rebuilt from SQLite on eviction recovery
  sessionState: CookingAgentState | null = null

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Cold-start detection — DO was evicted mid-session
    if (!this.sessionState && url.pathname === '/stream') {
      await this.recover()
    }

    switch (url.pathname) {
      case '/init':   return handleInit(request, this)
      case '/stream': return handleRealtimeStream(request, this)
      case '/audio':  return handleMobileAudio(request, this)
      default:        return new Response('Not found', { status: 404 })
    }
  }

  override async alarm(): Promise<void> {
    await handleAlarm(this)
  }
}
```

---

## In-Memory State

```typescript
interface CookingAgentState {
  sessionId:  string
  userId:     string
  meetingId:  string

  geminiWs:     WebSocket | null   // Gemini 3.1 Flash Live
  mobileWs:     WebSocket | null   // mobile receives Gemini audio here
  realtimeWs:   WebSocket | null   // Cloudflare Realtime adapter

  status:       'initializing' | 'active' | 'reconnecting' | 'ending' | 'ended'
  turnCounter:  number

  geminiReconnectTimer: ReturnType<typeof setTimeout> | null
  pendingToolCall: {
    id:   string
    name: string
    args: unknown
  } | null
}

// Active cooking timers — label → { alarmTime, alarmId }
activeTimers = new Map<string, { alarmTime: number; alarmId: string }>()
```

---

## Initialization

Pre-warms the Gemini session before mobile arrives — eliminates first-turn ~3s cold-start latency.

```typescript
// backend/src/agents/cooking/_handlers/init.handler.ts

export async function handleInit(request: Request, do: CookingAgent): Promise<Response> {
  const { sessionId, userId, meetingId } = await request.json() as {
    sessionId: string; userId: string; meetingId: string
  }

  do.sessionState = {
    sessionId, userId, meetingId,
    geminiWs: null, mobileWs: null, realtimeWs: null,
    status: 'initializing',
    turnCounter: 0,
    geminiReconnectTimer: null,
    pendingToolCall: null,
  }

  // Load user context from Orchestrator DO
  const context = await loadUserContext(userId, do.env)

  // Open Gemini session before mobile joins — pre-warming
  // See 03-gemini-live-session.md for the CAUTION on first-turn latency.
  await openGeminiSession(context, do)

  // Set turn counter in agent_state
  await upsertAgentState(do.env, userId, `turn_counter.${sessionId}`, '0')

  do.sessionState.status = 'active'
  return new Response('OK')
}
```

---

## Handling the Cloudflare Realtime Stream

The SFU adapter WebSocket connects here. Binary frames are PCM audio or JPEG — disambiguated by preceding metadata.

```typescript
// backend/src/agents/cooking/_handlers/realtime-stream.handler.ts

export async function handleRealtimeStream(request: Request, do: CookingAgent): Promise<Response> {
  // Validate HMAC from adapter
  const sig = request.headers.get('X-Adapter-Signature')
  if (!validateAdapterSignature(sig, do.sessionState!.sessionId, do.env.ADAPTER_SECRET)) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { 0: client, 1: server } = new WebSocketPair()
  server.accept()
  do.sessionState!.realtimeWs = server

  let nextFrameType: 'audio' | 'video' | null = null

  server.addEventListener('message', async (event) => {
    if (typeof event.data === 'string') {
      const msg = JSON.parse(event.data) as { type: string; frame_type?: string }
      if (msg.type === 'frame_metadata') {
        nextFrameType = msg.frame_type as 'audio' | 'video'
      }
    } else if (event.data instanceof ArrayBuffer) {
      if (nextFrameType === 'audio') {
        await sendAudioChunk(event.data, do)
        do.speechEngine?.onVoiceActivity(true)   // VAD signal to proactive engine
      } else if (nextFrameType === 'video') {
        await sendVideoFrame(event.data, do)
        do.speechEngine?.onVideoFrame(event.data)
      }
      nextFrameType = null
    }
  })

  server.addEventListener('close', () => {
    do.sessionState!.realtimeWs = null
    if (do.sessionState!.status === 'active') {
      upsertAgentState(do.env, do.sessionState!.userId,
        `stream.disconnect.${do.sessionState!.sessionId}`,
        JSON.stringify({ ts: Date.now() }),
      )
    }
  })

  return new Response(null, { status: 101, webSocket: client })
}
```

---

## Mobile Audio-Out WebSocket

Mobile opens this to receive Gemini's voice. Binary audio chunks from Gemini are forwarded here.

```typescript
// backend/src/agents/cooking/_handlers/mobile-audio.handler.ts

export async function handleMobileAudio(request: Request, do: CookingAgent): Promise<Response> {
  const { 0: client, 1: server } = new WebSocketPair()
  server.accept()
  do.sessionState!.mobileWs = server

  server.addEventListener('close', () => {
    do.sessionState!.mobileWs = null
    onMobileDisconnect(do)
  })

  return new Response(null, { status: 101, webSocket: client })
}
```

---

## DO Eviction Recovery

If Cloudflare evicts the DO mid-session, the next `/stream` request triggers recovery:

```typescript
private async recover(): Promise<void> {
  // Read active session from Orchestrator SQLite
  const orchestratorId = this.env.ORCHESTRATOR.idFromName(/* userId from DO name */)
  const orchestrator   = this.env.ORCHESTRATOR.get(orchestratorId)
  const resp  = await orchestrator.fetch('/internal/active-session')
  const session = await resp.json() as { id: string; userId: string; metadata: string } | null

  if (!session) return  // session ended while DO was evicted

  this.sessionState = {
    sessionId:  session.id,
    userId:     session.userId,
    meetingId:  JSON.parse(session.metadata).meetingId,
    geminiWs:   null, mobileWs: null, realtimeWs: null,
    status:     'reconnecting',
    turnCounter: 0,
    geminiReconnectTimer: null,
    pendingToolCall: null,
  }

  const context = await loadUserContext(session.userId, this.env)
  // Include recent transcript for Gemini continuity
  context.recentTranscript = await loadRecentTranscript(session.id, 20, this.env)

  await openGeminiSession(context, this)
  this.sessionState.status = 'active'
}
```

---

## Orchestrator Tool Forwarding

Every tool that touches SQLite is forwarded to the Orchestrator. The CookingAgent has no SQLite.

```typescript
export async function forwardToolToOrchestrator(
  toolName: string,
  toolArgs: unknown,
  state: CookingAgentState,
  env: Env,
): Promise<unknown> {
  const orchestratorId = env.ORCHESTRATOR.idFromName(state.userId)
  const orchestrator   = env.ORCHESTRATOR.get(orchestratorId)

  const resp = await orchestrator.fetch(new Request('https://internal/tool-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.INTERNAL_SECRET}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      caller:  'cooking',
      tool:    toolName,
      args:    toolArgs,
      run_id:  state.sessionId,
    }),
  }))

  if (!resp.ok) throw new Error(`Tool forward failed: ${resp.status}`)
  const { result } = await resp.json() as { result: unknown }
  return result
}
```

---

## `agent_state` Keys Written by CookingAgent

| Key | Value | Purpose |
|---|---|---|
| `turn_counter.{sessionId}` | integer string | Monotonic turn number — prevents race conditions on concurrent turn writes |
| `cooking.gemini_reconnect.{sessionId}` | `{ ts, attempt }` | Each proactive Gemini reconnect — debugging |
| `stream.disconnect.{sessionId}` | `{ ts }` | Unexpected Realtime adapter disconnect |
| `cooking.tool_failure.{sessionId}` | `{ tool, error, ts }` | Tool call failures during live session |
