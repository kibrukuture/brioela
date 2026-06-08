# Cooking Session — MiraSession Durable Object

## What This File Covers

MiraSession Agent class structure, all endpoints, recoverable live-session state, initialization, Cloudflare Realtime SFU track stream handling, mobile audio-out WebSocket, eviction recovery, and Brain tool forwarding.

---

## DO Identity and Scope

```
DO ID: env.MIRA_SESSION.idFromName(`cooking:${sessionId}`)
```

One Agent-backed Durable Object per cooking session. Session-scoped — not user-scoped. The Brain DO creates and addresses the MiraSession. MiraSession owns live runtime state and a small local recovery record; Brain owns persistent user SQLite truth.

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
├── mira-speech-decision/
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
// backend/src/agents/mira/mira-session.agent.ts

import { Agent } from 'agents'
import type { Env } from '@/types/env'
import { handleInit }           from './_handlers/init.handler'
import { handleRealtimeStream } from './_handlers/realtime-stream.handler'
import { handleMobileAudio }    from './_handlers/mobile-audio.handler'
import { handleAlarm }          from './_handlers/alarm.handler'

export class MiraSession extends Agent<Env> {
  // In-memory state — rebuilt from local Agent storage on eviction recovery
  sessionState: MiraSessionState | null = null

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Cold-start detection — Agent was evicted mid-session. Every endpoint can wake cold.
    if (!this.sessionState && url.pathname !== '/init') {
      await this.recover()
    }

    switch (url.pathname) {
      case '/init':   return handleInit(request, this)
      case '/stream/audio': return handleRealtimeStream(request, this, 'audio')
      case '/stream/video': return handleRealtimeStream(request, this, 'video')
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
interface MiraSessionState {
  sessionId:  string
  userId:     string
  meetingId:  string

  geminiWs:     WebSocket | null   // Gemini 3.1 Flash Live
  mobileWs:     WebSocket | null   // mobile receives Gemini audio here
  realtimeAudioWs: WebSocket | null // Cloudflare Realtime SFU audio adapter
  realtimeVideoWs: WebSocket | null // Cloudflare Realtime SFU video adapter

  status:       'initializing' | 'active' | 'mobile_reconnecting' | 'gemini_reconnecting' | 'ending' | 'ended'
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

export async function handleInit(request: Request, do: MiraSession): Promise<Response> {
  const { sessionId, userId, meetingId } = await request.json() as {
    sessionId: string; userId: string; meetingId: string
  }

  do.sessionState = {
    sessionId, userId, meetingId,
    geminiWs: null, mobileWs: null, realtimeAudioWs: null, realtimeVideoWs: null,
    status: 'initializing',
    turnCounter: 0,
    geminiReconnectTimer: null,
    pendingToolCall: null,
  }

  // Persist recovery bootstrap before opening external connections.
  await do.sql.exec(
    `INSERT OR REPLACE INTO cooking_session_runtime (session_id, user_id, meeting_id, status, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    sessionId, userId, meetingId, 'initializing', Date.now(),
  )

  // Load user context from Brain DO
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

## Handling Cloudflare Realtime SFU Track Streams

The SFU WebSocket adapter connects here per selected track. Binary messages are protobuf `Packet`
messages. Audio/video are disambiguated by endpoint path (`/stream/audio` or `/stream/video`), not by
JSON metadata inside the stream.

```typescript
// backend/src/agents/cooking/_handlers/realtime-stream.handler.ts

export async function handleRealtimeStream(
  request: Request,
  agent: MiraSession,
  mediaKind: 'audio' | 'video',
): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 })
  }

  const { 0: client, 1: server } = new WebSocketPair()
  agent.ctx.acceptWebSocket(server, [`realtime:${mediaKind}`])
  server.serializeAttachment({ kind: 'realtime', mediaKind })

  if (mediaKind === 'audio') agent.sessionState!.realtimeAudioWs = server
  else agent.sessionState!.realtimeVideoWs = server

  return new Response(null, { status: 101, webSocket: client })
}

// In MiraSession.webSocketMessage(ws, message):
// 1. Read ws.deserializeAttachment() to get mediaKind.
// 2. Decode protobuf Packet.
// 3. For audio, forward packet.payload PCM to Gemini Live.
// 4. For video, forward packet.payload JPEG to the visual-change detector.
```

---

## Mobile Audio-Out WebSocket

Mobile opens this to receive Gemini's voice. Binary audio chunks from Gemini are forwarded here.

```typescript
// backend/src/agents/cooking/_handlers/mobile-audio.handler.ts

export async function handleMobileAudio(request: Request, do: MiraSession): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 })
  }

  const { 0: client, 1: server } = new WebSocketPair()
  do.ctx.acceptWebSocket(server, ['mobile-audio'])
  server.serializeAttachment({ kind: 'mobile-audio' })
  do.sessionState!.mobileWs = server

  return new Response(null, { status: 101, webSocket: client })
}
```

---

## DO Eviction Recovery

If Cloudflare evicts the Agent mid-session, the next endpoint, WebSocket message, or alarm triggers recovery:

```typescript
private async recover(): Promise<void> {
  // Read local recovery bootstrap written during /init.
  const session = await this.sql.exec(
    `SELECT session_id, user_id, meeting_id, status FROM cooking_session_runtime LIMIT 1`,
  ).one<{ session_id: string; user_id: string; meeting_id: string; status: string }>()

  if (!session) return  // session ended while DO was evicted

  this.sessionState = {
    sessionId:  session.session_id,
    userId:     session.user_id,
    meetingId:  session.meeting_id,
    geminiWs:   null, mobileWs: null, realtimeAudioWs: null, realtimeVideoWs: null,
    status:     'gemini_reconnecting',
    turnCounter: 0,
    geminiReconnectTimer: null,
    pendingToolCall: null,
  }

  const context = await loadUserContext(session.user_id, this.env)
  // Include recent transcript for Gemini continuity
  context.recentTranscript = await loadRecentTranscript(session.session_id, 20, this.env)

  await openGeminiSession(context, this)
  this.sessionState.status = 'active'
}
```

---

## Brain Tool Forwarding

Every tool that touches persistent user memory/recipes/health SQLite is forwarded to the Brain. The MiraSession may use local Agent SQLite only for live-session recovery metadata, timers, adapter IDs, and connection bookkeeping.

```typescript
export async function forwardToolToBrain(
  toolName: string,
  toolArgs: unknown,
  state: MiraSessionState,
  env: Env,
): Promise<unknown> {
  const brainId = env.BRAIN.idFromName(state.userId)
  const brain   = env.BRAIN.get(brainId)

  const resp = await brain.fetch(new Request('https://internal/tool-call', {
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

## `agent_state` Keys Written by MiraSession

| Key | Value | Purpose |
|---|---|---|
| `turn_counter.{sessionId}` | integer string | Monotonic turn number — prevents race conditions on concurrent turn writes |
| `cooking.gemini_reconnect.{sessionId}` | `{ ts, attempt }` | Each proactive Gemini reconnect — debugging |
| `stream.disconnect.{sessionId}` | `{ ts }` | Unexpected Realtime adapter disconnect |
| `cooking.tool_failure.{sessionId}` | `{ tool, error, ts }` | Tool call failures during live session |
