# Cooking Session — Room Lifecycle (Cloudflare Realtime)

## What This File Covers

RealtimeKit Meeting creation, participant token generation, WebSocket adapter configuration, mobile join flow, and room teardown. This is the WebRTC transport layer — it carries audio and video from the mobile to the SFU, then the SFU delivers it to the CookingAgent DO.

---

## Why Cloudflare Realtime, Not LiveKit

LiveKit Cloud's media is WebRTC-only (DTLS/SRTP). A Durable Object has no WebRTC stack and cannot receive LiveKit media without a separate egress service — an extra process on Railway or Fly.io just to convert WebRTC → something the DO can receive.

Cloudflare Realtime's native WebSocket adapter delivers PCM audio (s16le, 48kHz) and JPEG frames directly to a DO's WebSocket endpoint. No third-party egress. No extra infrastructure. The SFU and the DO are on the same Cloudflare network — the media path is sub-millisecond internally. RealtimeKit runs on 310+ global PoPs via anycast.

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
                                         2. Create Participant + authToken
                                         3. Configure WebSocket Adapter
                                         4. Spawn CookingAgent DO + initialize
                                         5. Write sessions row to SQLite
                                             │
                                         Return { meetingId, authToken, doAudioEndpoint }
```

---

## RealtimeKit API Calls

```typescript
// backend/src/agents/orchestrator/_handlers/start-cooking.handler.ts

const REALTIMEKIT_BASE = 'https://api.realtimekit.io/v1'

async function createMeeting(sessionId: string, env: Env): Promise<string> {
  const resp = await fetch(`${REALTIMEKIT_BASE}/meetings`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(env.REALTIMEKIT_ORG_ID + ':' + env.REALTIMEKIT_API_KEY)}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      title:            `cooking-${sessionId}`,
      record:           false,
      max_participants: 3,     // user + family members (multi-person)
    }),
  })
  const { id } = await resp.json() as { id: string }
  return id
}

async function createParticipant(meetingId: string, userId: string, env: Env): Promise<string> {
  const resp = await fetch(`${REALTIMEKIT_BASE}/meetings/${meetingId}/participants`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(env.REALTIMEKIT_ORG_ID + ':' + env.REALTIMEKIT_API_KEY)}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      name:   userId,
      preset: 'host',   // full permissions: audio + video + host controls
    }),
  })
  const { token } = await resp.json() as { token: string }
  return token
}

async function configureWebSocketAdapter(
  meetingId: string,
  sessionId: string,
  env: Env,
): Promise<void> {
  // The adapter pushes all participant media to our Worker's /internal/cooking-stream/:sessionId
  // The Worker validates the signature and routes to the correct CookingAgent DO
  const adapterEndpoint = `${env.WORKER_BASE_URL}/internal/cooking-stream/${sessionId}`

  const resp = await fetch(`${REALTIMEKIT_BASE}/meetings/${meetingId}/adapters`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(env.REALTIMEKIT_ORG_ID + ':' + env.REALTIMEKIT_API_KEY)}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      type:     'websocket',
      endpoint: adapterEndpoint,
      secret:   env.ADAPTER_SECRET,    // HMAC — validated in CookingAgent DO
      tracks: {
        audio: { format: 'pcm_s16le', sample_rate: 48000 },
        video: { format: 'jpeg',      fps: 1 },
      },
    }),
  })
  if (!resp.ok) throw new Error(`Adapter config failed: ${resp.status} ${await resp.text()}`)
}
```

---

## Full Session Start — Orchestrator Handler

```typescript
// backend/src/agents/orchestrator/_handlers/start-cooking.handler.ts

export async function startCookingSession(userId: string, env: Env, db: DrizzleDB): Promise<{
  sessionId:       string
  meetingId:       string
  authToken:       string
  doAudioEndpoint: string
}> {
  const sessionId = crypto.randomUUID()

  const meetingId = await createMeeting(sessionId, env)
  const authToken = await createParticipant(meetingId, userId, env)
  await configureWebSocketAdapter(meetingId, sessionId, env)

  // Spawn CookingAgent DO
  const doId   = env.COOKING_AGENT.idFromName(`cooking:${sessionId}`)
  const doStub = env.COOKING_AGENT.get(doId)
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
    authToken,
    doAudioEndpoint: `${env.WORKER_BASE_URL}/cooking/${sessionId}/audio`,
  }
}
```

---

## Internal Stream Routing — Worker Endpoint

The Cloudflare Realtime adapter POSTs to `/internal/cooking-stream/:sessionId`. The Worker validates the HMAC and upgrades to WebSocket, routing to the correct CookingAgent DO:

```typescript
// backend/src/api/cooking/cooking.route.ts

cookingRouter.get('/internal/cooking-stream/:sessionId', async (c) => {
  const sessionId = c.req.param('sessionId')
  const sig       = c.req.header('X-Adapter-Signature')

  // Validate HMAC from adapter secret
  const expected = await computeHmac(env.ADAPTER_SECRET, sessionId)
  if (sig !== expected) return c.text('Unauthorized', 401)

  // Route WebSocket to CookingAgent DO
  const doId   = env.COOKING_AGENT.idFromName(`cooking:${sessionId}`)
  const doStub = env.COOKING_AGENT.get(doId)
  return doStub.fetch(c.req.raw)  // CF forwards WebSocket upgrade to DO
})
```

---

## Mobile Join — RealtimeKit SDK (React Native)

```typescript
// mobile/features/cooking-session/hooks/use.cooking-session.hook.ts

import { DyteClient } from '@dytesdk/react-native-core'

export async function joinCookingSession(sessionData: CookingSessionStart) {
  // 1. Join RealtimeKit room (sends audio/video via WebRTC)
  const meeting = await DyteClient.init({
    authToken: sessionData.authToken,
  })
  await meeting.joinRoom()

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

The RealtimeKit SDK (`@dytesdk/react-native-core`) handles the full WebRTC lifecycle — the mobile never touches raw WebRTC APIs.

---

## Room Teardown

Called by CookingAgent DO at session end:

```typescript
async function closeMeeting(meetingId: string, env: Env): Promise<void> {
  await fetch(`${REALTIMEKIT_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${btoa(env.REALTIMEKIT_ORG_ID + ':' + env.REALTIMEKIT_API_KEY)}`,
    },
  })
  // Closing the meeting kicks all participants + stops the WebSocket adapter
}
```

---

## Environment Variables

```
REALTIMEKIT_ORG_ID      Cloudflare RealtimeKit organization ID
REALTIMEKIT_API_KEY     RealtimeKit API key (for REST calls)
ADAPTER_SECRET          HMAC secret — shared between RealtimeKit SFU and our Worker
WORKER_BASE_URL         https://brioela.workers.dev — base for internal routing
```
