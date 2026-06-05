# Cooking Session — Room Lifecycle

## What a "Room" Is Here

A Cloudflare Realtime room (RealtimeKit Meeting) is the WebRTC transport layer for one cooking session. It handles:
- WebRTC connection from the mobile device
- Delivering audio and video from mobile to the Cloudflare Realtime SFU
- Pushing that media to the CookingAgent DO via the native WebSocket adapter

A room is session-scoped. One cooking session = one Meeting. When the session ends, the Meeting is closed. Rooms are NOT persistent between sessions.

---

## Room Creation Flow

The Orchestrator DO creates the room when the user starts a cooking session. It calls the RealtimeKit REST API, then creates the CookingAgent DO, then returns the join token to the mobile.

```
Mobile ──── POST /api/cooking/start ────► Worker (routes to Orchestrator DO)
                                               │
                                               │ 1. Create RealtimeKit Meeting
                                               │ 2. Create Participant + authToken
                                               │ 3. Configure WebSocket Adapter
                                               │ 4. Create session row in SQLite
                                               │ 5. Spawn CookingAgent DO
                                               │
                                               ▼
                                          Return to Mobile:
                                          { meetingId, authToken, doEndpoint }
```

---

## RealtimeKit API Calls

### 1. Create Meeting

```typescript
const REALTIMEKIT_BASE = 'https://api.realtimekit.io/v1'
const REALTIMEKIT_ORG  = env.REALTIMEKIT_ORG_ID
const REALTIMEKIT_KEY  = env.REALTIMEKIT_API_KEY

async function createMeeting(sessionId: string): Promise<string> {
  const resp = await fetch(`${REALTIMEKIT_BASE}/meetings`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(REALTIMEKIT_ORG + ':' + REALTIMEKIT_KEY)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title:      `cooking-${sessionId}`,
      record:     false,           // recording handled separately if needed
      max_participants: 3,         // user + possible family members watching
    }),
  })
  const { id: meetingId } = await resp.json()
  return meetingId
}
```

### 2. Create Participant + authToken

```typescript
async function createParticipant(meetingId: string, userId: string): Promise<string> {
  const resp = await fetch(`${REALTIMEKIT_BASE}/meetings/${meetingId}/participants`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(REALTIMEKIT_ORG + ':' + REALTIMEKIT_KEY)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name:   userId,
      preset: 'host',             // full permissions: audio, video, screen share
    }),
  })
  const { token: authToken } = await resp.json()
  return authToken
  // authToken is passed to mobile — used by RealtimeKit SDK to join the room
}
```

### 3. Configure WebSocket Adapter

This is the critical step. It tells Cloudflare Realtime to push the mobile participant's audio and video to the CookingAgent DO's WebSocket endpoint.

```typescript
async function configureWebSocketAdapter(
  meetingId:  string,
  sessionId:  string,
  doStubId:   DurableObjectId,
  env:        Env,
): Promise<void> {
  // The CookingAgent DO's WebSocket endpoint is addressed via its DO stub
  // We pass the DO stub URL through a shared secret — the SFU adapter POSTs
  // to our Worker which routes to the correct DO
  const adapterEndpoint = `${env.WORKER_BASE_URL}/internal/cooking-stream/${sessionId}`

  const resp = await fetch(`${REALTIMEKIT_BASE}/meetings/${meetingId}/adapters`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(REALTIMEKIT_ORG + ':' + REALTIMEKIT_KEY)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type:     'websocket',
      endpoint: adapterEndpoint,
      secret:   env.ADAPTER_SECRET,       // HMAC validation in the DO
      tracks: {
        audio: { format: 'pcm_s16le', sample_rate: 48000 },
        video: { format: 'jpeg',      fps: 1 },
      },
    }),
  })
  if (!resp.ok) throw new Error(`Adapter config failed: ${await resp.text()}`)
}
```

The Worker at `/internal/cooking-stream/:sessionId` validates the HMAC from the adapter secret, looks up the CookingAgent DO stub by sessionId, and upgrades the connection to WebSocket — forwarding it to the DO.

---

## Session Start — Orchestrator DO

```typescript
async function startCookingSession(userId: string, env: Env): Promise<CookingSessionStart> {
  const sessionId  = crypto.randomUUID()
  const meetingId  = await createMeeting(sessionId)
  const authToken  = await createParticipant(meetingId, userId)

  // Create CookingAgent DO
  const doId = env.COOKING_AGENT.idFromName(`cooking:${sessionId}`)
  const doStub = env.COOKING_AGENT.get(doId)

  await configureWebSocketAdapter(meetingId, sessionId, doId, env)

  // Initialize the CookingAgent DO with session context
  await doStub.fetch('/init', {
    method: 'POST',
    body: JSON.stringify({ sessionId, userId, meetingId }),
  })

  // Write session row to SQLite
  await db.insert(sessions).values({
    id:         sessionId,
    userId:     userId,
    sessionType: 'cooking',
    status:     'active',
    metadata:   JSON.stringify({ meetingId }),
    startedAt:  Date.now(),
  }).run()

  // Update active_session_id in agent_state
  await db.insert(agentState).values({
    key:       'active_session_id',
    userId:    userId,
    value:     sessionId,
    updatedAt: Date.now(),
  }).onConflictDoUpdate({
    target: agentState.key,
    set:    { value: sessionId, updatedAt: Date.now() },
  }).run()

  return {
    sessionId,
    meetingId,
    authToken,           // mobile uses this with RealtimeKit SDK to join
    doAudioEndpoint: `${env.WORKER_BASE_URL}/cooking/${sessionId}/audio`,
    // doAudioEndpoint: mobile opens WebSocket here to receive Gemini audio back
  }
}
```

---

## Mobile Join Flow

Mobile receives `{ meetingId, authToken, doAudioEndpoint }` from the server. It then:

1. Joins the RealtimeKit room using the SDK:
```swift
// iOS (Swift)
let meeting = try await DyteClient.init(meetingInfo: DyteMeetingInfoV2(
    authToken: authToken
))
meeting.addMeetingRoomEventsListener(meetingRoomEventsListener: self)
try await meeting.joinRoom()
```

2. Opens WebSocket to CookingAgent DO to receive Gemini audio:
```swift
let audioSocket = URLSession.shared.webSocketTask(with: URL(string: doAudioEndpoint)!)
audioSocket.resume()
// receive loop — plays incoming audio chunks through speaker
```

The mobile sends audio/video via WebRTC (RealtimeKit SDK handles this automatically once joined). It receives Gemini's voice via the separate WebSocket.

---

## Room Teardown

At session end, the CookingAgent DO tears down the room:

```typescript
async function closeMeeting(meetingId: string, env: Env): Promise<void> {
  await fetch(`${REALTIMEKIT_BASE}/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${btoa(env.REALTIMEKIT_ORG_ID + ':' + env.REALTIMEKIT_API_KEY)}`,
    },
  })
  // Closing the meeting kicks all participants and stops the WebSocket adapter
}
```

---

## Environment Variables Required

```
REALTIMEKIT_ORG_ID      Cloudflare RealtimeKit organization ID
REALTIMEKIT_API_KEY     RealtimeKit API key
ADAPTER_SECRET          HMAC secret shared between RealtimeKit and our Worker
WORKER_BASE_URL         Base URL for internal routing (https://brioela.workers.dev)
```

---

## What This File Does NOT Cover

- CookingAgent DO internals → `02-cooking-agent.md`
- What the WebSocket adapter delivers to the DO → `05-video-processing.md`
- Session end cleanup → `08-session-end.md`
