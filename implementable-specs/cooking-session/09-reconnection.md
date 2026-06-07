# Cooking Session — Reconnection and Session Chaining

## Two Reconnection Scenarios

A 45-minute cooking session has two distinct reconnection concerns:

1. **Gemini session reconnection** — Gemini Live sessions have limits. Proactive reconnect keeps the AI alive across the full session without the user noticing.
2. **Mobile WebSocket reconnection** — the user's mobile connection drops briefly (bad network, screen lock, backgrounding the app). The session must survive without losing state.

These are independent. Either can happen at any time.

---

## Gemini Session — Proactive Reconnect

Gemini 3.1 Flash Live has session limits that are not fully published. The confirmed limit from Gemini 2.5 Flash Live is 15 minutes for audio-only sessions (the `client_content` inline image approach avoids the 2-minute video cap, so we operate in audio-only session mode from Gemini's perspective).

To avoid ever hitting the limit, the DO proactively reconnects the Gemini session every **90 seconds**. This is conservative — well within any published or undiscovered limit. Each reconnect:
- Closes the current Gemini WebSocket gracefully
- Opens a new Gemini WebSocket
- Sends a fresh setup message with updated context
- Resumes audio and video frame forwarding

From the user's perspective: a brief pause of under 1 second during reconnect. The AI may say "let me continue" or simply resume — depending on whether it hears audio from the user during the reconnect window.

```typescript
private scheduleGeminiReconnect(): void {
  this.sessionState.geminiReconnectTimer = setTimeout(async () => {
    if (this.sessionState.status === 'active') {
      await this.proactiveGeminiReconnect()
    }
  }, 90_000)  // 90 seconds
}

private async proactiveGeminiReconnect(): Promise<void> {
  this.sessionState.status = 'reconnecting'

  // Log to agent_state
  const attempt = await this.incrementReconnectAttempt()
  await this.upsertAgentState(
    `cooking.gemini_reconnect.${this.sessionState.sessionId}`,
    JSON.stringify({ ts: Date.now(), attempt }),
  )

  // Write system event to transcript
  await this.writeSystemEvent(`Gemini session reconnected (attempt ${attempt})`)

  // Close current Gemini WebSocket
  if (this.sessionState.geminiWs) {
    this.sessionState.geminiWs.close(1000, 'proactive_reconnect')
    this.sessionState.geminiWs = null
  }

  // Build updated context (include recent transcript for continuity)
  const context = await this.loadUserContext(this.sessionState.userId)
  context.recentTranscript = await this.loadRecentTranscript(20)  // last 20 turns

  // Open new Gemini session
  await this.openGeminiSession(context)

  // Drain any timer fires that queued during reconnect
  await this.drainPendingTimerFires()

  this.sessionState.status = 'active'

  // Schedule next reconnect
  this.scheduleGeminiReconnect()
}
```

---

## Context Continuity Across Gemini Reconnects

Each reconnect builds a fresh system instruction. To maintain conversational continuity across the reconnect boundary, the last 20 turns of the transcript are injected into the new session's context:

```typescript
private buildSystemInstruction(context: UserContext): string {
  const parts = [/* ... user identity, constraints, memory, skills ... */]

  // Continuity: inject recent conversation history
  if (context.recentTranscript && context.recentTranscript.length > 0) {
    parts.push(`\n## RECENT CONVERSATION (this session, last ${context.recentTranscript.length} turns):`)
    for (const turn of context.recentTranscript) {
      parts.push(`[${turn.role}] ${turn.content}`)
    }
    parts.push(`Continue the cooking session naturally. The user is still cooking. Do not restart the introduction.`)
  }

  return parts.join('\n')
}
```

With this context, Gemini knows what dish was being made, what timers were set, what stage the cooking is at — it picks up naturally. The user hears a very brief pause and then the AI continues.

---

## Mobile WebSocket Reconnection

The mobile's WebSocket to the CookingAgent DO (the `doAudioEndpoint`) can drop. Causes: bad network, brief backgrounding, screen lock, tunnel reconnect.

**What the mobile does:** maintain a reconnect loop with exponential backoff. On disconnect, wait 1s, 2s, 4s, 8s, then give up after 5 minutes.

**What the DO does:** when `mobileWs` closes:

```typescript
private onMobileDisconnect(): void {
  this.mobileDisconnectedAt = Date.now()
  this.sessionState.mobileWs = null

  // Start a 5-minute timeout — if mobile doesn't reconnect, end the session
  setTimeout(() => {
    if (!this.sessionState.mobileWs && this.sessionState.status === 'active') {
      this.endSession('mobile_disconnected')
    }
  }, 5 * 60 * 1000)

  // The Gemini session keeps running during mobile disconnect
  // Gemini may speak — audio is dropped (no mobile connection to send to)
  // When mobile reconnects, it hears only from the reconnect point forward
}
```

**Key decision: Gemini keeps running during mobile disconnect.**

Gemini does not know the mobile disconnected. It continues processing audio from the Cloudflare Realtime adapter (the user may still be speaking in the kitchen). Any Gemini audio output during the disconnect is dropped (no mobile WebSocket to send to). When the mobile reconnects, it receives audio from that point forward. The user may miss a few seconds of AI speech — acceptable for a brief network hiccup.

**When the mobile reconnects:**

```typescript
private async handleMobileAudio(request: Request): Promise<Response> {
  const { 0: client, 1: server } = new WebSocketPair()
  server.accept()

  this.sessionState.mobileWs = server
  this.mobileDisconnectedAt = null  // reconnected — clear disconnect timestamp

  // If Gemini is mid-sentence, it will continue to the mobile naturally
  // No special re-sync needed — audio is a live stream from this point

  server.addEventListener('close', () => this.onMobileDisconnect())

  return new Response(null, { status: 101, webSocket: client })
}
```

---

## Cloudflare Realtime Room — Mobile Reconnection

If the mobile drops the WebRTC connection to Cloudflare Realtime (separate from the DO WebSocket), the RealtimeKit SDK handles reconnection automatically on the mobile side. The room persists — the Cloudflare Realtime SFU does not close the meeting when one participant disconnects. If the participant token expires, refresh it through the RealtimeKit participant token refresh API rather than creating a second participant.

The WebSocket adapter from the SFU to the DO continues sending audio/video from any still-connected participants. If the user was the only participant and they disconnect, the SFU adapter sends silence/no frames. When they reconnect, the adapter resumes sending.

---

## Unexpected Gemini Close (Not Proactive)

If the Gemini WebSocket closes unexpectedly (model error, rate limit, Google infra issue), the DO attempts an emergency reconnect:

```typescript
private onGeminiClose(code: number, reason: string): void {
  this.sessionState.geminiWs = null

  if (this.sessionState.status === 'ending') return

  if (this.sessionState.status === 'active' || this.sessionState.status === 'reconnecting') {
    this.emergencyGeminiReconnect()
  }
}

private async emergencyGeminiReconnect(attempt = 1): Promise<void> {
  if (attempt > 3) {
    // Three failures — end the session
    await this.endSession('error')
    return
  }

  this.sessionState.status = 'reconnecting'

  // Exponential backoff: 1s, 2s, 4s
  await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)))

  try {
    const context = await this.loadUserContext(this.sessionState.userId)
    context.recentTranscript = await this.loadRecentTranscript(20)
    await this.openGeminiSession(context)
    await this.drainPendingTimerFires()
    this.sessionState.status = 'active'
    this.scheduleGeminiReconnect()  // resume proactive reconnect schedule
  } catch {
    await this.emergencyGeminiReconnect(attempt + 1)
  }
}
```

---

## Reconnect State Summary

| Reconnect Type | Triggered By | Gemini Continues? | User Impact |
|---|---|---|---|
| Proactive Gemini reconnect | 90s timer | New session with full context | ~1s pause |
| Emergency Gemini reconnect | Unexpected close | New session, up to 3 attempts | 1–7s pause |
| Mobile WebSocket reconnect | Network drop | Yes — keeps running | Misses audio during gap |
| Mobile WebRTC reconnect | Network drop | Yes — SFU stays up | RealtimeKit handles automatically |

---

## What Does NOT Survive Reconnection

- **Gemini's working memory within the session** — Gemini does not remember the exact words spoken before the reconnect boundary. The transcript injection (last 20 turns) gives it enough context to continue naturally, but fine-grained conversational state is reset.
- **Audio mid-sentence** — if Gemini was speaking when the reconnect started, that sentence is lost. The new session starts fresh from the next Gemini response.
- **Pending tool calls** — if a tool call was in flight when the Gemini session closed, the tool response is dropped. The tool may or may not have executed. The DO's `pendingToolCall` state is cleared on reconnect.
