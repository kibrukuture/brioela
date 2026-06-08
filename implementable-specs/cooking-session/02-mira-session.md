# Cooking Session — Mira session Durable Object

## Current Cloudflare Runtime Correction

This older implementable spec uses raw Durable Object patterns. Before coding, use
`build-guide/08-cooking-session/02-mira-session-do.md` as the current source of truth.

Current direction:

- Mira session runtime should be an Agent-backed Durable Object using the current `agents` package, not the deprecated scoped package name.
- Mira owns live runtime state plus a small local recovery ledger; Brain owns persistent user memory/recipes/health SQLite.
- Inbound WebSockets should validate `Upgrade: websocket` and use hibernation-aware Agent/DO WebSocket handling where possible.
- Cloudflare Realtime SFU media frames arrive as protobuf `Packet` messages per selected track, not JSON metadata followed by raw binary.
- Timers should use Agents SDK `schedule()` with local timer rows and idempotent callbacks, not raw DO alarms as the default.
- Recovery cannot derive `userId` from `cooking:${sessionId}`. Persist `{ sessionId, userId, meetingId }` during `/init`.

The product intent below remains useful, but stale implementation snippets must be reconciled before coding.

## What the Mira session DO Is

The Mira session runtime is a Cloudflare Durable Object that controls everything for one cooking session. It is the single point of authority for:
- Receiving audio and video from Cloudflare Realtime
- Maintaining the Gemini 3.1 Flash Live WebSocket session
- Executing or forwarding all tool calls
- Maintaining local recovery metadata while forwarding persistent user writes to Brain
- Managing cooking timers via Agents SDK schedules
- Sending Gemini's audio response back to the mobile

**DO ID:** `env.MIRA_SESSION.idFromName(\`cooking:${sessionId}\`)`

Session-scoped. One cooking session = one DO. The Brain DO creates it. When the session ends, it is no longer addressed. Cloudflare eventually evicts it. All critical state is in SQLite before eviction can matter.

---

## DO Endpoints

```typescript
export class MiraSessionDO implements DurableObject {
  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    switch (url.pathname) {
      case '/init':
        return this.handleInit(request)

      case '/stream':
        // Cloudflare Realtime WebSocket adapter connects here
        return this.handleRealtimeStream(request)

      case '/audio':
        // Mobile WebSocket — receives Gemini audio output
        return this.handleMobileAudio(request)

      case '/alarm-fired':
        // Internal — timer alarm notification
        return this.handleAlarmFired(request)

      default:
        return new Response('Not found', { status: 404 })
    }
  }

  async alarm(): Promise<void> {
    // DO alarm fires → inject timer notification into Gemini session
    await this.fireNextTimer()
  }
}
```

---

## In-Memory State

The DO holds runtime state in memory. If Cloudflare evicts the DO mid-session, `restart()` recovers from SQLite and reconnects to Gemini.

```typescript
interface MiraSessionState {
  // Session identity
  sessionId:  string
  userId:     string
  meetingId:  string

  // Connections
  geminiWs:     WebSocket | null    // Gemini 3.1 Flash Live WebSocket
  mobileWs:     WebSocket | null    // Mobile audio-out WebSocket
  realtimeWs:   WebSocket | null    // Cloudflare Realtime adapter WebSocket

  // Session state
  status:       'initializing' | 'active' | 'reconnecting' | 'ending' | 'ended'
  turnCounter:  number              // mirrors agent_state turn_counter.{sessionId}
  geminiReconnectTimer: ReturnType<typeof setTimeout> | null

  // Pending tool call (BLOCKING — only one at a time)
  pendingToolCall: {
    id:       string
    name:     string
    args:     unknown
  } | null
}
```

---

## Initialization

```typescript
private async handleInit(request: Request): Promise<Response> {
  const { sessionId, userId, meetingId } = await request.json()

  this.sessionState = {
    sessionId, userId, meetingId,
    geminiWs: null, mobileWs: null, realtimeWs: null,
    status: 'initializing',
    turnCounter: 0,
    geminiReconnectTimer: null,
    pendingToolCall: null,
  }

  // Load user context from Brain DO for Gemini system instruction
  const context = await this.loadUserContext(userId)

  // Open Gemini Live session BEFORE mobile joins the room — pre-warming
  // CAUTION: This pre-warming is designed to eliminate the ~3s cold-start
  // first-turn latency that Gemini Live API shows in production (documented
  // by developers on GitHub issue #1197 and Google Dev Forum). The theory:
  // by the time the user speaks their first word, the WebSocket is already
  // open and warm, so the first response comes back in ~500ms instead of ~3s.
  //
  // TEST THIS IN PRODUCTION before treating it as solved. Pre-warming may
  // not fully eliminate the dead air — Gemini's cold-start cost may be
  // internal to the model, not just the WebSocket setup. If dead air persists
  // after pre-warming, fallback options to test:
  //   Option B: Send Gemini a silent "session ready" ping immediately on open
  //             to force model warm-up before user speaks
  //   Option C: Play a short audio greeting from a pre-recorded clip while
  //             the model warms up ("Starting your cooking session...")
  //   Option D: Accept the first-turn delay and set user expectation in the
  //             UI ("Connecting to your cooking companion...")
  // Do not implement Options B/C/D now — test A (pre-warming) first.
  await this.openGeminiSession(context)

  // Update agent_state: turn counter starts at 0
  await this.upsertAgentState(`turn_counter.${sessionId}`, '0')

  this.sessionState.status = 'active'

  return new Response('OK')
}
```

---

## Handling Cloudflare Realtime SFU Track Streams

The current documented Cloudflare Realtime SFU WebSocket adapter connects per selected track. The Agent receives protobuf `Packet` binary messages. Audio and video are separated by endpoint path or WebSocket attachment.

```typescript
private async handleRealtimeStream(request: Request, mediaKind: 'audio' | 'video'): Promise<Response> {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 })
  }

  const token = new URL(request.url).searchParams.get('token')
  if (!token || !(await this.verifyAdapterToken(token, mediaKind))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { 0: client, 1: server } = new WebSocketPair()
  this.ctx.acceptWebSocket(server, [`realtime:${mediaKind}`])
  server.serializeAttachment({ kind: 'realtime', mediaKind })

  if (mediaKind === 'audio') this.sessionState.realtimeAudioWs = server
  else this.sessionState.realtimeVideoWs = server

  return new Response(null, { status: 101, webSocket: client })
}
```

`webSocketMessage()` decodes the protobuf `Packet`, then forwards `packet.payload` to Gemini as PCM
audio or to the visual-change detector as JPEG. Do not rely on JSON metadata frames.

---

## Handling Mobile Audio-Out WebSocket

The mobile opens this WebSocket to receive Gemini's audio response. Binary audio chunks from Gemini are forwarded here.

```typescript
private async handleMobileAudio(request: Request): Promise<Response> {
  const { 0: client, 1: server } = new WebSocketPair()
  server.accept()

  this.sessionState.mobileWs = server

  server.addEventListener('close', () => {
    this.sessionState.mobileWs = null
    // Mobile disconnect — pause session, wait for reconnect
    this.onMobileDisconnect()
  })

  return new Response(null, { status: 101, webSocket: client })
}
```

---

## DO Eviction Recovery

If Cloudflare evicts the DO mid-session (always possible), the next request triggers a cold start. The DO detects this by checking its in-memory state — if `sessionState` is null, it recovers.

```typescript
async fetch(request: Request): Promise<Response> {
  // Cold start detection
  if (!this.sessionState && request.url.includes('/stream')) {
    await this.recover()
  }
  // ... route to handler
}

private async recover(): Promise<void> {
  // Read session from SQLite via Brain
  const session = await this.fetchActiveSession()
  if (!session) return  // session ended while DO was evicted — nothing to recover

  this.sessionState = {
    sessionId:  session.id,
    userId:     session.userId,
    meetingId:  JSON.parse(session.metadata).meetingId,
    status:     'reconnecting',
    // ... rest of state
  }

  const context = await this.loadUserContext(session.userId)
  await this.openGeminiSession(context)

  this.sessionState.status = 'active'
}
```

---

## Brain Communication (Tool Forwarding)

When Gemini calls a tool that touches SQLite, the Mira session DO forwards to the Brain DO:

```typescript
private async forwardToolToBrain(
  toolName: string,
  toolArgs: unknown,
): Promise<unknown> {
  const brainId = this.env.BRAIN.idFromName(this.sessionState.userId)
  const brain   = this.env.BRAIN.get(brainId)

  const resp = await brain.fetch('/internal/tool-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.env.DO_INTERNAL_SECRET}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      caller:   'cooking',
      tool:     toolName,
      args:     toolArgs,
      session:  this.sessionState.sessionId,
    }),
  })

  if (!resp.ok) throw new Error(`Tool forward failed: ${resp.status}`)
  return resp.json()
}
```

---

## agent_state Keys Written by Mira Session Runtime

| Key | Value | When |
|---|---|---|
| `turn_counter.{sessionId}` | integer as string | Incremented before every session_turns insert |
| `active_session_id` | sessionId | Set when session starts (via Brain) |
| `cooking.gemini_reconnect.{sessionId}` | `{ ts, attempt }` | Each Gemini session reconnect |
| `stream.disconnect.{sessionId}` | `{ ts }` | If Cloudflare Realtime adapter disconnects unexpectedly |
| `cooking.tool_failure.{sessionId}` | `{ tool, error, ts }` | If a tool call fails during session |

---

## What This File Does NOT Cover

- Gemini session internals → `03-gemini-session.md`
- Tool call protocol → `04-tool-protocol.md`
- Video frame forwarding → `05-video-processing.md`
- Timer alarms → `06-timers.md`
- Transcript writes → `07-transcript-storage.md`
- Session end → `08-session-end.md`
- Reconnection logic → `09-reconnection.md`
