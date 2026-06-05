# Proactive Speech Engine — Suppression Rules

## Purpose

Suppression rules are the final gate before an observation request is sent to Gemini. Even if the silence tracker says it is time, even if the visual change detector says something changed, even if the frequency controller says the interval has elapsed — the suppression rules can still block the request entirely.

There are two tiers: **hard blocks** (absolute, no override) and **soft blocks** (can be bypassed by urgency).

---

## Hard Blocks — Never Bypass, Not Even for Urgency

```typescript
function isHardBlocked(state: EngineState): { blocked: boolean; reason: string } {
  // 1. User is currently speaking
  if (state.silenceTracker.isUserSpeaking()) {
    return { blocked: true, reason: 'user_speaking' }
  }

  // 2. Gemini is currently speaking (its audio is streaming to mobile right now)
  if (state.geminiCurrentlySpeaking) {
    return { blocked: true, reason: 'gemini_speaking' }
  }

  // 3. Session is not in active state
  if (state.sessionStatus !== 'active') {
    return { blocked: true, reason: `session_status_${state.sessionStatus}` }
  }

  // 4. A proactive observation request is already in flight (waiting for Gemini response)
  if (state.pendingObservationRequest !== null) {
    return { blocked: true, reason: 'observation_in_flight' }
  }

  return { blocked: false, reason: '' }
}
```

**Why these four are absolute:**

1. **User speaking** — interrupting the user mid-sentence is the most disruptive thing an AI can do in a conversation. Even if oil is smoking, wait for the user to finish their word (Gemini will receive the observation request within seconds once they stop).

2. **Gemini speaking** — if Gemini is already speaking, sending another turn_complete will create overlapping audio. Gemini's output must complete before new input arrives.

3. **Session not active** — during reconnection, the Gemini session may not be able to receive messages. Sending into a reconnecting session causes lost messages and undefined state.

4. **Observation in flight** — one observation at a time. If Gemini is processing the last observation request, don't send another until it responds.

---

## Soft Blocks — Bypassed by Urgent Requests

```typescript
function isSoftBlocked(state: EngineState): { blocked: boolean; reason: string } {
  // 1. Gemini spoke very recently
  const msSinceGeminiSpoke = state.geminiLastSpeechEndedAt
    ? Date.now() - state.geminiLastSpeechEndedAt
    : null

  if (msSinceGeminiSpoke !== null && msSinceGeminiSpoke < 25_000) {
    return { blocked: true, reason: 'gemini_spoke_recently' }
  }

  // 2. User spoke very recently (10-second dead zone after speech)
  const msSinceUserSpoke = state.silenceTracker.getTimeSinceLastSpeechMs()
  if (msSinceUserSpoke !== null && msSinceUserSpoke < 10_000) {
    return { blocked: true, reason: 'user_spoke_recently' }
  }

  // 3. Session just started (first 30 seconds — introductions in progress)
  const sessionAgeMs = Date.now() - state.sessionStartedAt
  if (sessionAgeMs < 30_000) {
    return { blocked: true, reason: 'session_just_started' }
  }

  // 4. Too many observations in the last 5 minutes (rate limit)
  if (state.observationCountLast5Min >= 8) {
    return { blocked: true, reason: 'rate_limit' }
  }

  return { blocked: false, reason: '' }
}
```

**Why these are soft (urgency bypasses them):**

1. **Gemini spoke recently (25s)** — a human coach waits after they speak. But if oil is smoking 10 seconds after Gemini just said something else, Gemini should still alert immediately.

2. **User spoke recently (10s)** — let the user's words settle. But an urgent safety issue overrides this.

3. **Session just started (30s)** — the introduction is in progress. Don't interrupt greetings with proactive observations. But a kitchen emergency during the first 30 seconds should still trigger a response.

4. **Rate limit (8 observations/5 min)** — prevents runaway behavior if the engine gets stuck in a high-urgency loop. Urgent requests bypass this because genuine emergencies can cascade.

---

## Soft Block Urgency Bypass

```typescript
tick(): ObservationRequest | null {
  const hardBlock = isHardBlocked(this.state)
  if (hardBlock.blocked) return null   // hard block — nothing goes through

  const latestFrame = this.visualChangeDetector.getLastAnalysis()

  // Urgency check — bypasses soft blocks
  if (latestFrame?.urgencySignal) {
    // Urgent visual change — bypass soft blocks, send immediately
    return this.promptBuilder.buildUrgentPrompt(this.currentContext())
  }

  const softBlock = isSoftBlocked(this.state)
  if (softBlock.blocked) return null   // soft block — advisory requests wait

  // Normal frequency check
  const elapsed = Date.now() - (this.lastObservationAt ?? 0)
  const requiredInterval = this.adaptiveFrequency.calculateInterval(this.state)
  if (elapsed < requiredInterval) return null

  return this.promptBuilder.buildAdvisoryPrompt(this.currentContext())
}
```

---

## Rate Limit Counter

```typescript
private observationLog: number[] = []  // timestamps of each observation sent

private countObservationsLast5Min(): number {
  const cutoff = Date.now() - 5 * 60 * 1000
  this.observationLog = this.observationLog.filter(ts => ts > cutoff)
  return this.observationLog.length
}

private recordObservation(): void {
  this.observationLog.push(Date.now())
}
```

8 observations per 5 minutes = one every ~37.5 seconds. This is the outer maximum. The adaptive frequency controller will normally produce far fewer. The rate limit is a backstop against a bug where the engine runs continuously.

---

## The Human Quality These Rules Create

A human cooking coach watching grandma cook does not:
- Interrupt mid-sentence
- Start talking while they are already talking
- Jump in 3 seconds after grandma finishes saying something
- Comment 8 times in a row within 5 minutes

These suppression rules encode exactly that behavior. The result is an AI that feels like it knows when to speak and — more importantly — knows when to shut up.
