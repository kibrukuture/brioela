# Cooking Session — Proactive Speech Engine

## What This File Covers

How Gemini decides to speak without being asked — the ProactiveSpeechEngine module, all six sub-components, and the human behavior rules encoded in the system instruction.

---

## Why This Exists

Without this engine, Gemini is reactive — it only speaks when the user speaks. A real cooking coach watches, notices things, and speaks when something matters. The ProactiveSpeechEngine implements that behavior by deciding when to send Gemini an observation prompt and what that prompt should be.

The engine does not talk to Gemini directly. It does not write to SQLite. It produces `ObservationRequest | null` — the CookingAgent DO acts on the request.

---

## TypeScript Interface

```typescript
// backend/src/agents/cooking/proactive-speech/index.ts

export type CookingPhase = 'prep' | 'active' | 'simmering' | 'finishing'

export interface ObservationRequest {
  prompt:       string               // full text sent to Gemini as client_content
  urgency:      'urgent' | 'advisory'
  turnComplete: true                 // always true — requires a response
}

export interface ObservationResponse {
  forward:  boolean                  // true = send Gemini audio to mobile
  urgency:  'urgent' | 'advisory' | 'silent'
  topic?:   string                   // track for no-repeat memory
}

export class ProactiveSpeechEngine {
  constructor(config: { sessionId: string; userId: string }) {}

  onVoiceActivity(active: boolean): void   // called on every audio frame metadata
  onVideoFrame(jpegData: ArrayBuffer): void // called on every JPEG frame
  onGeminiSpeechStart(): void              // called when Gemini begins speaking

  // Called by CookingAgent every second
  tick(phase: CookingPhase, activeTimerLabels: string[]): ObservationRequest | null

  // Called by CookingAgent after Gemini responds to an observation prompt
  classifyResponse(responseText: string): ObservationResponse
}
```

The CookingAgent calls `tick()` every second. If it returns an `ObservationRequest`, the agent sends the prompt to Gemini. If Gemini's response passes the `classifyResponse()` filter, the audio is forwarded to mobile.

---

## Sub-Component 1 — Silence Tracker

Tracks how long the user has been silent. The Cloudflare Realtime adapter sends audio metadata with VAD (voice activity detection) state.

```typescript
// backend/src/agents/cooking/proactive-speech/silence-tracker.ts

export class SilenceTracker {
  private silentSince: number | null = null
  private isUserSpeaking = false

  onVoiceActivity(active: boolean): void {
    if (active) {
      this.isUserSpeaking = true
      this.silentSince    = null
    } else {
      if (this.isUserSpeaking) {
        this.silentSince    = Date.now()
        this.isUserSpeaking = false
      }
    }
  }

  getSilenceDurationMs(): number {
    if (this.silentSince === null) return 0
    return Date.now() - this.silentSince
  }

  isSpeaking(): boolean { return this.isUserSpeaking }
}
```

---

## Sub-Component 2 — Visual Change Detector

Compares incoming JPEG frames to detect meaningful motion or change. Simple pixel-diff at low resolution — no ML.

```typescript
// backend/src/agents/cooking/proactive-speech/visual-change-detector.ts

export class VisualChangeDetector {
  private lastFrameData: Uint8Array | null = null
  private changeScore   = 0   // 0.0–1.0: 0 = static, 1 = high motion

  onVideoFrame(jpegData: ArrayBuffer): void {
    // Downsample JPEG to 16x16 greyscale for fast diff
    const current = downsampleJpeg(jpegData, 16, 16)

    if (this.lastFrameData) {
      let diff = 0
      for (let i = 0; i < current.length; i++) {
        diff += Math.abs(current[i]! - this.lastFrameData[i]!)
      }
      // Normalize: max possible diff per pixel = 255
      this.changeScore = diff / (current.length * 255)
    }

    this.lastFrameData = current
  }

  getChangeScore(): number   { return this.changeScore }
  isHighMotion(): boolean    { return this.changeScore > 0.15 }
  isStaticScene(): boolean   { return this.changeScore < 0.02 }
  isUrgentMotion(): boolean  { return this.changeScore > 0.40 }  // smoke, spill, rapid movement
}
```

---

## Sub-Component 3 — Adaptive Frequency

Determines how often to attempt an observation, based on cooking phase and session state.

```typescript
// backend/src/agents/cooking/proactive-speech/adaptive-frequency.ts

const PHASE_INTERVALS: Record<CookingPhase, { min: number; max: number }> = {
  prep:      { min: 45_000, max: 90_000  },  // 45s–90s between observations
  active:    { min: 20_000, max: 45_000  },  // 20s–45s — most vigilant
  simmering: { min: 60_000, max: 120_000 },  // 60s–120s — quiet during waits
  finishing: { min: 30_000, max: 60_000  },  // 30s–60s — wrap-up
}

export class AdaptiveFrequency {
  private lastObservationAt = 0
  private currentInterval   = 60_000

  shouldAttemptObservation(phase: CookingPhase, changeScore: number): boolean {
    const now     = Date.now()
    const elapsed = now - this.lastObservationAt

    const { min, max } = PHASE_INTERVALS[phase]

    // Urgent visual change — override interval floor
    if (changeScore > 0.40 && elapsed > 5_000) return true

    // Normal interval check
    const targetInterval = min + (max - min) * (1 - changeScore)  // more active = shorter interval
    return elapsed >= targetInterval
  }

  recordObservation(): void {
    this.lastObservationAt = Date.now()
  }
}
```

---

## Sub-Component 4 — Prompt Builder

Builds the observation prompt sent to Gemini based on current context.

```typescript
// backend/src/agents/cooking/proactive-speech/prompt-builder.ts

export function buildObservationPrompt(
  phase: CookingPhase,
  silenceDuration: number,
  changeScore: number,
  activeTimerLabels: string[],
): string {
  const context: string[] = []

  context.push(`You are observing the kitchen. The user has been silent for ${Math.round(silenceDuration / 1000)} seconds.`)

  if (changeScore > 0.40) {
    context.push(`There is significant movement or change in the camera view. Check if something needs attention.`)
  } else if (changeScore < 0.02) {
    context.push(`The scene is very static.`)
  }

  if (activeTimerLabels.length > 0) {
    context.push(`Active timers: ${activeTimerLabels.join(', ')}.`)
  }

  context.push(`Phase: ${phase}.`)

  switch (phase) {
    case 'active':
      context.push(`If you notice something that needs attention (heat level, timing, technique), say it briefly. If everything looks fine, say nothing meaningful — respond with only "ok".`)
      break
    case 'simmering':
      context.push(`The user is waiting. Only speak if something is wrong or the scene has changed significantly. Otherwise respond with only "ok".`)
      break
    case 'prep':
    case 'finishing':
      context.push(`Observe and comment only if you notice something genuinely worth saying. Otherwise respond with only "ok".`)
      break
  }

  return context.join(' ')
}
```

---

## Sub-Component 5 — Response Filter

Determines whether Gemini's response to an observation prompt should be forwarded to the mobile speaker.

```typescript
// backend/src/agents/cooking/proactive-speech/response-filter.ts

// Responses that should never reach the user's speaker
const SILENT_PATTERNS = [
  /^ok\.?$/i,
  /^okay\.?$/i,
  /^looks good\.?$/i,
  /^everything looks fine\.?$/i,
  /^nothing to note\.?$/i,
  /^no issues\.?$/i,
  /^carrying on\.?$/i,
]

// Topics we recently said — avoid repeating the same observation
const recentTopics = new Set<string>()

export function filterObservationResponse(responseText: string): ObservationResponse {
  const normalized = responseText.trim().toLowerCase()

  // Discard silent/filler responses
  if (SILENT_PATTERNS.some(p => p.test(normalized))) {
    return { forward: false, urgency: 'silent' }
  }

  // Detect urgency
  const isUrgent = /smoke|burn|fire|boil over|overflow|fall|spill|wrong/i.test(responseText)

  // Extract topic to prevent repeats (simple first-sentence extraction)
  const topic = responseText.split('.')[0]?.toLowerCase().trim() ?? ''

  if (recentTopics.has(topic)) {
    return { forward: false, urgency: 'silent' }
  }

  // Add to recent topics — expire after 5 minutes
  recentTopics.add(topic)
  setTimeout(() => recentTopics.delete(topic), 5 * 60 * 1000)

  return {
    forward:  true,
    urgency:  isUrgent ? 'urgent' : 'advisory',
    topic,
  }
}
```

---

## Sub-Component 6 — Suppression Rules

Hard rules that override everything. If any suppression rule is active, `tick()` returns null.

```typescript
// backend/src/agents/cooking/proactive-speech/suppression-rules.ts

export function isSuppressed(params: {
  isUserSpeaking:     boolean
  isGeminiSpeaking:   boolean
  pendingToolCall:    boolean
  status:             string
  silenceDuration:    number
  lastObservationAt:  number
}): boolean {
  // Never interrupt the user
  if (params.isUserSpeaking) return true

  // Never interrupt Gemini itself
  if (params.isGeminiSpeaking) return true

  // Never during a pending tool call (Gemini is paused)
  if (params.pendingToolCall) return true

  // Never when session is reconnecting or ending
  if (params.status !== 'active') return true

  // Never within 3 seconds of the previous observation
  if (Date.now() - params.lastObservationAt < 3_000) return true

  // Never if user has been silent for less than 8 seconds — they may just be focused
  if (params.silenceDuration < 8_000) return true

  return false
}
```

---

## Human Behavior Rules — System Instruction Sections

These rules live in the Gemini system instruction built in `03-gemini-live-session.md`.

**Non-response (do not react to everything):**
```
Do not respond to: self-narration ("okay now I add onions"), sounds of thinking ("hmm", "uh"), 
talking to other people in the room, reacting to food ("oh that smells good").
Respond when: directly asked, your name is said, timer fires, you see something needing attention.
```

**Adaptive verbosity:**
```
Early session: fuller explanations. Mid-session: shorter, essential only. 
Late session: trust the cook. If grandma clearly knows exactly what she is doing, 
your role shifts from teacher to quiet watchful presence.
```

**Phase awareness:**
```
PREP: Present and ready. Answer questions. Do not over-comment.
ACTIVE: Vigilant. If you see something needing attention, say it briefly.
SIMMERING: Quietest. Do not fill silence with small talk.
FINISHING: Warm, celebratory. Offer to note the recipe. Stop coaching.
```
