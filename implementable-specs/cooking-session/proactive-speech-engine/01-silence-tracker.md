# Proactive Speech Engine — Silence Tracker

## Purpose

The silence tracker knows how long the user has been silent. This is the primary input for deciding whether Gemini should proactively observe. A user who has been silent for 30 seconds while cooking is a different situation from a user who just finished speaking 5 seconds ago.

---

## Voice Activity Signal

The Cloudflare Realtime SFU WebSocket adapter delivers audio payloads as PCM inside protobuf packets. Current public docs do not provide adapter VAD metadata, so Brioela computes voice activity locally from PCM energy or a lightweight VAD helper.

```typescript
interface AudioActivitySample {
  durationMs: number
  hasVoiceActivity: boolean   // true = user is speaking, false = silence
}
```

The Mira session runtime calls `speechEngine.onVoiceActivity(hasVoiceActivity)` after local VAD evaluates each audio payload.

---

## Silence Tracker State

```typescript
interface SilenceTrackerState {
  silenceStartedAt:     number | null    // timestamp when user last stopped speaking
  lastSpeechEndedAt:    number | null    // timestamp of last user speech end
  currentlyVoiceActive: boolean          // is user speaking right now
  consecutiveSilenceMs: number           // how long current silence has lasted
}
```

---

## Implementation

```typescript
class SilenceTracker {
  private state: SilenceTrackerState = {
    silenceStartedAt:     null,
    lastSpeechEndedAt:    null,
    currentlyVoiceActive: false,
    consecutiveSilenceMs: 0,
  }

  onVoiceActivity(active: boolean): void {
    const now = Date.now()

    if (active && !this.state.currentlyVoiceActive) {
      // User started speaking — reset silence
      this.state.currentlyVoiceActive   = true
      this.state.silenceStartedAt       = null
      this.state.consecutiveSilenceMs   = 0
    }

    if (!active && this.state.currentlyVoiceActive) {
      // User stopped speaking — start silence timer
      this.state.currentlyVoiceActive = false
      this.state.lastSpeechEndedAt    = now
      this.state.silenceStartedAt     = now
    }

    if (!active && this.state.silenceStartedAt) {
      // User still silent — update duration
      this.state.consecutiveSilenceMs = now - this.state.silenceStartedAt
    }
  }

  getSilenceDurationMs(): number {
    return this.state.consecutiveSilenceMs
  }

  isUserSpeaking(): boolean {
    return this.state.currentlyVoiceActive
  }

  getTimeSinceLastSpeechMs(): number | null {
    if (!this.state.lastSpeechEndedAt) return null
    return Date.now() - this.state.lastSpeechEndedAt
  }
}
```

---

## Silence Duration → Observation Eligibility

The silence tracker feeds into the adaptive frequency controller (`03-adaptive-frequency.md`). The thresholds:

| Silence Duration | Eligibility |
|---|---|
| 0 – 10s | Never — user just stopped speaking, leave them space |
| 10 – 15s | Not yet — settling threshold |
| 15s – 60s | Eligible — normal proactive observation window |
| 60s+ | Eligible — reduced frequency (simmering phase likely) |
| User currently speaking | Hard block — never |

The 10-second dead zone after speech is critical. A human coach does not jump in the moment someone stops talking. They wait, they let the moment settle. 10 seconds of guaranteed silence before the first possible proactive comment is what creates that human quality.

---

## Session Start Behavior

At session start, the tracker initializes with `silenceStartedAt: null`. This means no silence is tracked until the first speech event occurs. During the first 30 seconds, when Gemini is introducing itself and the user is responding, the proactive engine is naturally suppressed because the user is speaking frequently. No special case needed.

---

## What the Silence Tracker Does NOT Do

- It does not decide to speak — that is the frequency controller
- It does not check Gemini's speaking state — that is tracked separately in the engine's main state
- It does not write anything to SQLite or agent_state
