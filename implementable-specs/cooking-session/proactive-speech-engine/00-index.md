# Proactive Speech Engine — Index

## What This Is

The ProactiveSpeechEngine is a self-contained module used by the Mira session runtime. It answers one question continuously: **should Gemini speak right now, and if so, with what prompt?**

Without this engine, Gemini only speaks when the user speaks — it is reactive. With this engine, Gemini watches the kitchen, notices things, and speaks when it judges it necessary. That is what makes the cooking session feel like a human coach is present rather than a voice assistant waiting for commands.

The engine does not talk to Gemini directly. It does not write to SQLite. It produces decisions — `ObservationRequest | null` — and the Mira session runtime acts on them.

---

## Files in This Folder

| File | What It Covers |
|---|---|
| [01-silence-tracker.md](./01-silence-tracker.md) | Tracking user silence duration and voice activity state |
| [02-visual-change-detector.md](./02-visual-change-detector.md) | Comparing frames to detect motion, color change, urgency signals |
| [03-adaptive-frequency.md](./03-adaptive-frequency.md) | How often to run an observation — based on phase, silence, visual activity |
| [04-prompt-builder.md](./04-prompt-builder.md) | What prompt to send Gemini for each observation type |
| [05-response-filter.md](./05-response-filter.md) | Filtering Gemini's response — discard silence, classify urgency, block repeats |
| [06-suppression-rules.md](./06-suppression-rules.md) | When to NOT speak — hard rules that override everything else |

---

## TypeScript Interface (What Mira Session Runtime Imports)

```typescript
export interface ProactiveSpeechConfig {
  sessionId:          string
  userId:             string
  cookingPhase:       CookingPhase          // updated by DO as session progresses
  activeTimerLabels:  string[]              // passed by DO when timers are set/cancelled
}

export type CookingPhase = 'prep' | 'active' | 'simmering' | 'finishing'

export interface ObservationRequest {
  prompt:        string        // the full text to send Gemini as client_content
  urgency:       'urgent' | 'advisory'
  turnComplete:  true          // always true — this IS a full turn that requires a response
}

export interface ObservationResponse {
  forward:   boolean           // true = send Gemini's audio to mobile
  urgency:   'urgent' | 'advisory' | 'silent'
  topic?:    string            // extracted topic to track for no-repeat memory
}

export class ProactiveSpeechEngine {
  constructor(config: ProactiveSpeechConfig) {}

  // Called by Mira session runtime on every audio metadata frame from Cloudflare Realtime adapter
  onVoiceActivity(active: boolean): void

  // Called by Mira session runtime on every JPEG frame received from Cloudflare Realtime adapter
  onVideoFrame(jpegData: ArrayBuffer): void

  // Called by Mira session runtime when Gemini starts producing audio output
  onGeminiSpeechStart(): void

  // Called by Mira session runtime when Gemini finishes a complete turn (turn_complete)
  onGeminiSpeechEnd(): void

  // Called by Mira session runtime when a cooking timer fires
  onTimerFired(label: string): void

  // Called by Mira session runtime on its main loop tick (every 1 second)
  // Returns an observation request if the engine decides to speak, null otherwise
  tick(): ObservationRequest | null

  // Called by Mira session runtime after Gemini responds to an observation request
  onObservationResponse(rawResponse: string): ObservationResponse

  // Called by Mira session runtime when the cooking phase changes
  setPhase(phase: CookingPhase): void
}
```

---

## How Mira Session Runtime Uses This Engine

```typescript
// In Mira session runtime — initialization
this.speechEngine = new ProactiveSpeechEngine({
  sessionId:         this.sessionState.sessionId,
  userId:            this.sessionState.userId,
  cookingPhase:      'prep',
  activeTimerLabels: [],
})

// In the audio frame handler
this.speechEngine.onVoiceActivity(frameMetadata.hasVoiceActivity)

// In the video frame handler — BEFORE forwarding to Gemini
this.speechEngine.onVideoFrame(jpegData)

// In Gemini speech event handlers
ws.on('modelTurnStart', () => this.speechEngine.onGeminiSpeechStart())
ws.on('turnComplete',   () => this.speechEngine.onGeminiSpeechEnd())

// In the DO's 1-second interval (setInterval equivalent via DO state)
const request = this.speechEngine.tick()
if (request) {
  this.geminiWs.send(JSON.stringify({
    client_content: {
      turns: [{ role: 'user', parts: [{ text: request.prompt }] }],
      turn_complete: true,
    },
  }))
  this.pendingObservationRequest = request
}

// After Gemini responds to the observation
const decision = this.speechEngine.onObservationResponse(geminiTextResponse)
if (!decision.forward) {
  // Discard — don't send audio to mobile
  this.discardCurrentGeminiAudio()
}
```

---

## Engine State (Internal)

The engine is pure in-memory. It does not read or write SQLite. If the DO is evicted and restarts, the engine reinitializes with clean state. The worst effect: a brief period after restart where the engine has no visual history to compare against, so it starts fresh observation cycles. This is acceptable.

---

## What This Engine Is NOT Responsible For

- Sending audio to Gemini → Mira session runtime
- Forwarding audio to mobile → Mira session runtime
- Timer scheduling → `06-timers.md`
- Transcript writes → `07-transcript-storage.md`
- Gemini session reconnection → `09-reconnection.md`
