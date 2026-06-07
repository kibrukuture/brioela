# Cooking Session — Room Lifecycle

## What a "Room" Is Here

A Cloudflare RealtimeKit Meeting is the WebRTC room layer for one cooking session. It handles:
- WebRTC connection from the mobile device
- Delivering audio and video from mobile to the Cloudflare Realtime SFU
- Participant room lifecycle. Media-to-DO uses the documented Cloudflare Realtime SFU track adapter, not a RealtimeKit meeting-level adapter.

Brioela may choose one Meeting per cooking session as product policy, but Cloudflare RealtimeKit Meetings are reusable by default. A live Session starts when participants join and ends after they leave.

---

## Room Creation Flow

The Orchestrator DO creates the room when the user starts a cooking session. It calls the RealtimeKit REST API, then creates the CookingAgent DO, then returns the join token to the mobile.

```
Mobile ──── POST /api/cooking/start ────► Worker (routes to Orchestrator DO)
                                               │
                                               │ 1. Create RealtimeKit Meeting
                                               │ 2. Create Participant + participantToken
                                               │ 3. Initialize CookingAgent DO
                                               │ 4. Create session row in SQLite
                                               │ 5. Spawn CookingAgent DO
                                               │
                                               ▼
                                          Return to Mobile:
                                          { meetingId, participantToken, doEndpoint }
```

---

## RealtimeKit API Calls

### 1. Create Meeting

```typescript
const REALTIMEKIT_BASE = (env: Env) =>
  `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/realtime/kit/${env.REALTIMEKIT_APP_ID}`

const realtimeKitHeaders = (env: Env) => ({
  'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
  'Content-Type': 'application/json',
})

async function createMeeting(sessionId: string, env: Env): Promise<string> {
  const resp = await fetch(`${REALTIMEKIT_BASE(env)}/meetings`, {
    method: 'POST',
    headers: realtimeKitHeaders(env),
    body: JSON.stringify({
      title:      `cooking-${sessionId}`,
      record_on_start: false,
      persist_chat: false,
    }),
  })
  const json = await resp.json() as { data: { id: string } }
  return json.data.id
}
```

### 2. Create Participant + participantToken

```typescript
async function createParticipant(meetingId: string, userId: string, env: Env): Promise<string> {
  const resp = await fetch(`${REALTIMEKIT_BASE(env)}/meetings/${meetingId}/participants`, {
    method: 'POST',
    headers: realtimeKitHeaders(env),
    body: JSON.stringify({
      custom_participant_id: `user:${userId}`,
      name: userId,
      preset_name: 'host',
    }),
  })
  const json = await resp.json() as { data: { token: string } }
  return json.data.token
  // participantToken is passed to mobile — used by RealtimeKit SDK to join the room
}
```

### 3. Configure WebSocket Adapter

This is the critical step. Current public Cloudflare docs place the WebSocket media adapter under Realtime SFU, attached to selected SFU tracks. It is not a RealtimeKit meeting-level `/adapters` endpoint.

```typescript
const REALTIME_SFU_BASE = 'https://rtc.live.cloudflare.com/v1'

async function configureTrackWebSocketAdapter(
  sfuSessionId: string,
  trackName: string,
  mediaKind: 'audio' | 'video',
  sessionId: string,
  env: Env,
): Promise<{ adapterId: string }> {
  const adapterEndpoint = `${env.WORKER_WS_BASE_URL}/internal/cooking-stream/${sessionId}/${mediaKind}?token=${await signAdapterToken(sessionId, mediaKind, env)}`

  const resp = await fetch(`${REALTIME_SFU_BASE}/apps/${env.REALTIME_SFU_APP_ID}/adapters/websocket/new`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.REALTIME_SFU_APP_SECRET}`,
      'Content-Type': 'application/json',
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
  if (!resp.ok) throw new Error(`Adapter config failed: ${await resp.text()}`)
  const json = await resp.json() as { tracks: Array<{ adapterId: string }> }
  return { adapterId: json.tracks[0]!.adapterId }
}
```

The Worker at `/internal/cooking-stream/:sessionId/:mediaKind` validates the signed adapter token, looks up the CookingAgent DO stub by sessionId, and upgrades the connection to WebSocket — forwarding it to the DO. Media arrives as protobuf `Packet` messages.

---

## Session Start — Orchestrator DO

```typescript
async function startCookingSession(userId: string, env: Env): Promise<CookingSessionStart> {
  const sessionId  = crypto.randomUUID()
  const meetingId  = await createMeeting(sessionId, env)
  const participantToken = await createParticipant(meetingId, userId, env)

  // Create CookingAgent DO
  const doId = env.COOKING_AGENT.idFromName(`cooking:${sessionId}`)
  const doStub = env.COOKING_AGENT.get(doId)

  // SFU adapters are configured after the mobile publishes tracks and track names are known.

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
    participantToken,    // mobile uses this with RealtimeKit SDK to join
    doAudioEndpoint: `${env.WORKER_WS_BASE_URL}/cooking/${sessionId}/audio?token=${await signMobileAudioToken(sessionId, userId, env)}`,
    // doAudioEndpoint: mobile opens WebSocket here to receive Gemini audio back
  }
}
```

---

## Mobile Join Flow

Mobile receives `{ meetingId, participantToken, doAudioEndpoint }` from the server. It then:

1. Joins the RealtimeKit room using the SDK:
```swift
// iOS (Swift)
let meeting = try await RealtimeKitClient.init(authToken: participantToken)
meeting.addMeetingRoomEventsListener(meetingRoomEventsListener: self)
try await meeting.join()
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

At session end, Brioela ends the active RealtimeKit session and optionally disables the one-time Meeting:

```typescript
async function endActiveRealtimeKitSession(meetingId: string, env: Env): Promise<void> {
  await fetch(`${REALTIMEKIT_BASE(env)}/meetings/${meetingId}/active-session/kick-all`, {
    method: 'POST',
    headers: realtimeKitHeaders(env),
  })

  await fetch(`${REALTIMEKIT_BASE(env)}/meetings/${meetingId}`, {
    method: 'PATCH',
    headers: realtimeKitHeaders(env),
    body: JSON.stringify({ status: 'INACTIVE' }),
  })
}
```

Close SFU WebSocket adapters separately with stored adapter ids.

---

## Environment Variables Required

```
CLOUDFLARE_ACCOUNT_ID       Cloudflare account id
CLOUDFLARE_API_TOKEN        scoped API token with Realtime permissions
REALTIMEKIT_APP_ID          RealtimeKit app id
REALTIME_SFU_APP_ID         Realtime SFU app id, if using track adapters
REALTIME_SFU_APP_SECRET     Realtime SFU app secret
WORKER_BASE_URL             https://api.brioela.com
WORKER_WS_BASE_URL          wss://api.brioela.com
```

---

## What This File Does NOT Cover

- CookingAgent DO internals → `02-cooking-agent.md`
- What the WebSocket adapter delivers to the DO → `05-video-processing.md`
- Session end cleanup → `08-session-end.md`
