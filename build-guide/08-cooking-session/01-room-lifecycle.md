# Cooking Session — Room Lifecycle (Cloudflare Realtime)

## What This File Covers

RealtimeKit Meeting creation, participant token generation, SFU track adapter configuration, mobile join flow, and active-session teardown. This is the WebRTC transport layer — it carries audio and video from mobile to Cloudflare Realtime, then selected SFU tracks can be bridged to the CookingAgent DO.

---

## Why Cloudflare Realtime / RealtimeKit

RealtimeKit gives Brioela a managed realtime room layer while keeping the CookingAgent DO as the agent brain. Cloudflare's documented WebSocket media adapter currently lives under Realtime SFU and attaches to specific SFU tracks, not to an entire RealtimeKit meeting.

Cloudflare Realtime SFU's WebSocket adapter can stream selected remote tracks to a `wss://` endpoint as protobuf media packets: PCM audio (s16le, 48kHz stereo) or JPEG video frames. The adapter is beta and per-track. Do not assume one meeting-level adapter or one mixed room stream unless Cloudflare documents that bridge for RealtimeKit.

**Decision recorded in:** `implementable-specs/cooking-session/00-overview.md` line 73.

---

## Two Connections from Mobile

```
Mobile
  ├── WebRTC → Cloudflare Realtime SFU      (sends mic audio + camera video)
  └── WebSocket → CookingAgent DO           (receives Gemini audio back)
```

The mobile sends via WebRTC — RealtimeKit SDK handles all complexity (NAT traversal, codec negotiation, echo cancellation, packet loss). The mobile receives Gemini's voice via a plain binary WebSocket — no WebRTC complexity on the receive side.

---

## Room Creation Flow

The Orchestrator DO handles this when the user taps "Start Cooking Session":

```
Mobile ── POST /api/cooking/start ──► Hono Worker → Orchestrator DO
                                             │
                                         1. Create RealtimeKit Meeting
                                         2. Create Participant + participantToken
                                         3. Spawn + initialize CookingAgent DO
                                         4. Write sessions row to SQLite
                                         5. After tracks exist, attach SFU adapters
                                             │
                                         Return { meetingId, participantToken, doAudioEndpoint }
```

---

## RealtimeKit API Calls

```typescript
// backend/src/agents/orchestrator/_handlers/start-cooking.handler.ts

const REALTIMEKIT_BASE = (env: Env) =>
  `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/realtime/kit/${env.REALTIMEKIT_APP_ID}`

const realtimeKitHeaders = (env: Env) => ({
  'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
  'Content-Type':  'application/json',
})

async function createMeeting(sessionId: string, env: Env): Promise<string> {
  const resp = await fetch(`${REALTIMEKIT_BASE(env)}/meetings`, {
    method: 'POST',
    headers: realtimeKitHeaders(env),
    body: JSON.stringify({
      title: `cooking-${sessionId}`,
      record_on_start: false,
      persist_chat: false,
      session_keep_alive_time_in_secs: 0,
    }),
  })
  const json = await resp.json() as { data: { id: string } }
  return json.data.id
}

async function createParticipant(meetingId: string, userId: string, env: Env): Promise<string> {
  const resp = await fetch(`${REALTIMEKIT_BASE(env)}/meetings/${meetingId}/participants`, {
    method: 'POST',
    headers: realtimeKitHeaders(env),
    body: JSON.stringify({
      custom_participant_id: `user:${userId}`,
      name: userId,
      preset_name: 'host',   // configured in RealtimeKit app presets
    }),
  })
  const json = await resp.json() as { data: { token: string } }
  return json.data.token
}

const REALTIME_SFU_BASE = 'https://rtc.live.cloudflare.com/v1'

async function createTrackWebSocketAdapter(
  sfuSessionId: string,
  trackName: string,
  mediaKind: 'audio' | 'video',
  sessionId: string,
  env: Env,
): Promise<{ adapterId: string }> {
  // Current documented Cloudflare WebSocket adapter is SFU track-level and beta.
  // It streams one selected remote track to one wss:// endpoint as protobuf Packet messages.
  const adapterEndpoint = `${env.WORKER_WS_BASE_URL}/internal/cooking-stream/${sessionId}/${mediaKind}?token=${await signAdapterToken(sessionId, mediaKind, env)}`

  const resp = await fetch(`${REALTIME_SFU_BASE}/apps/${env.REALTIME_SFU_APP_ID}/adapters/websocket/new`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.REALTIME_SFU_APP_SECRET}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      tracks: [{
        location: 'remote',
        sessionId: sfuSessionId,
        trackName,
        endpoint: adapterEndpoint,
        outputCodec: mediaKind === 'audio' ? 'pcm' : 'jpeg',
      }],
    }),
  })
  if (!resp.ok) throw new Error(`Adapter config failed: ${resp.status} ${await resp.text()}`)
  const json = await resp.json() as { tracks: Array<{ adapterId: string }> }
  return { adapterId: json.tracks[0]!.adapterId }
}
```

Adapter creation requires the active SFU `sessionId` and `trackName`. Those are not available before
participants publish media. The implementation must discover or receive track IDs after join, then
create one adapter per selected audio/video track. Do not document or implement a room-level
`/meetings/{meetingId}/adapters` API unless Cloudflare publishes it.

---

## Full Session Start — Orchestrator Handler

```typescript
// backend/src/agents/orchestrator/_handlers/start-cooking.handler.ts

export async function startCookingSession(userId: string, env: Env, db: DrizzleDB): Promise<{
  sessionId:       string
  meetingId:       string
  participantToken: string
  doAudioEndpoint: string
}> {
  const sessionId = crypto.randomUUID()

  const meetingId = await createMeeting(sessionId, env)
  const participantToken = await createParticipant(meetingId, userId, env)

  // Spawn CookingAgent DO
  const doId   = c.env.COOKING_AGENT.idFromName(`cooking:${sessionId}`)
  const doStub = c.env.COOKING_AGENT.get(doId)
  await doStub.fetch(new Request('https://internal/init', {
    method: 'POST',
    body:   JSON.stringify({ sessionId, userId, meetingId }),
  }))

  // Write session row to Orchestrator SQLite
  db.insert(sessions).values({
    id:          sessionId,
    userId,
    sessionType: 'cooking',
    status:      'active',
    model:       'gemini-3.1-flash-live-preview',
    startedAt:   Date.now(),
  }).run()

  // Set active_session_id in agent_state
  db.insert(agentState).values({
    key:       'active_session_id',
    userId,
    value:     sessionId,
    updatedAt: Date.now(),
  }).onConflictDoUpdate({
    target: agentState.key,
    set:    { value: sessionId, updatedAt: Date.now() },
  }).run()

  return {
    sessionId,
    meetingId,
    participantToken,
    doAudioEndpoint: `${env.WORKER_WS_BASE_URL}/cooking/${sessionId}/audio?token=${await signMobileAudioToken(sessionId, userId, env)}`,
  }
}
```

---

## Internal Stream Routing — Worker Endpoint

The Cloudflare SFU adapter connects to `wss://.../internal/cooking-stream/:sessionId/:mediaKind`. The Worker validates the signed adapter token and upgrades to WebSocket, routing to the correct CookingAgent DO. Media frames are protobuf `Packet` binary messages; the DO knows media kind from the endpoint path, not from JSON metadata.

```typescript
// backend/src/api/cooking/cooking.route.ts

cookingRouter.get('/internal/cooking-stream/:sessionId/:mediaKind', async (c) => {
  const sessionId = c.req.param('sessionId')
  const mediaKind = c.req.param('mediaKind')
  const token     = c.req.query('token')

  if (c.req.header('Upgrade')?.toLowerCase() !== 'websocket') return c.text('Expected WebSocket', 426)
  if (!token || !(await verifyAdapterToken(token, sessionId, mediaKind, c.env))) return c.text('Unauthorized', 401)

  // Route WebSocket to CookingAgent DO
  const doId   = env.COOKING_AGENT.idFromName(`cooking:${sessionId}`)
  const doStub = env.COOKING_AGENT.get(doId)
  return doStub.fetch(new Request(`https://do.internal/stream/${mediaKind}`, c.req.raw))
})
```

---

## Mobile Join — RealtimeKit SDK (React Native)

```typescript
// mobile/features/cooking-session/hooks/use.cooking-session.hook.ts

import { useRealtimeKitClient } from '@cloudflare/realtimekit-react-native'

export async function joinCookingSession(sessionData: CookingSessionStart) {
  // 1. Join RealtimeKit room (sends audio/video via WebRTC)
  const meeting = await createRealtimeKitClient({
    authToken: sessionData.participantToken,
  })
  await meeting.join()

  // 2. Open WebSocket to receive Gemini audio back
  const audioSocket = new WebSocket(sessionData.doAudioEndpoint)
  audioSocket.binaryType = 'arraybuffer'

  audioSocket.onmessage = (event) => {
    // PCM audio from Gemini — play through speaker
    playAudioChunk(event.data as ArrayBuffer)
  }

  return { meeting, audioSocket }
}
```

The RealtimeKit SDK (`@cloudflare/realtimekit-react-native`) handles the full WebRTC lifecycle — the mobile never touches raw WebRTC APIs.

---

## Room Teardown

Called at session end:

```typescript
async function endActiveRealtimeKitSession(meetingId: string, env: Env): Promise<void> {
  await fetch(`${REALTIMEKIT_BASE(env)}/meetings/${meetingId}/active-session/kick-all`, {
    method: 'POST',
    headers: realtimeKitHeaders(env),
  })

  // If Brioela uses one meeting per cooking session, disable future joins after kicking participants.
  await fetch(`${REALTIMEKIT_BASE(env)}/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: realtimeKitHeaders(env),
    body: JSON.stringify({ status: 'INACTIVE' }),
  })
}
```

Close any SFU WebSocket adapters separately with `POST /v1/apps/{appId}/adapters/websocket/close`
using the stored `adapterId`s. RealtimeKit Meeting teardown and SFU adapter teardown are separate
operations.

---

## Environment Variables

```
CLOUDFLARE_ACCOUNT_ID       Cloudflare account id
CLOUDFLARE_API_TOKEN        scoped API token with Realtime permissions
REALTIMEKIT_APP_ID          Cloudflare RealtimeKit app id
REALTIME_SFU_APP_ID         Cloudflare Realtime SFU app id, if using track adapters
REALTIME_SFU_APP_SECRET     Realtime SFU app secret for adapter API calls
WORKER_BASE_URL             https://api.brioela.com — HTTP API base
WORKER_WS_BASE_URL          wss://api.brioela.com — WebSocket API base
```
