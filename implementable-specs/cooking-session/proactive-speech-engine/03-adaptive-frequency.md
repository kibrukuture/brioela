# Proactive Speech Engine — Adaptive Frequency Controller

## Purpose

The adaptive frequency controller decides how often to run an observation check — how many seconds must pass before the engine is even eligible to send Gemini an observation prompt. It takes inputs from the silence tracker, visual change detector, phase awareness, and timer state, and outputs a single number: the minimum interval before the next check.

---

## Cooking Phase → Base Interval

The cooking phase is the primary input. The CookingAgent DO sets the phase as the session progresses.

| Phase | Base Interval | Reasoning |
|---|---|---|
| `prep` | 20s | User chopping, measuring — moderate vigilance |
| `active` | 12s | Frying, sautéing, boiling — most likely to need intervention |
| `simmering` | 60s | Timer running, food on low heat — minimal risk, stay quiet |
| `finishing` | 30s | Plating, tasting — watch but don't interrupt the moment |

Phase transitions are set by the CookingAgent DO based on context signals:
- `prep` → `active`: when a timer is set OR Gemini hears "I'm starting to fry / heat the oil"
- `active` → `simmering`: when a long timer is set (>5 min) AND visual change drops to stable
- `simmering` → `active`: when timer fires
- `active` → `finishing`: when Gemini hears "done / ready / let's plate"

If the phase is never explicitly set, it defaults to `active` for the full session. Over-vigilance is preferable to missing something burning.

---

## Dynamic Modifiers

On top of the base interval, the controller applies modifiers that can tighten or relax the interval.

```typescript
interface FrequencyModifiers {
  visualChangeBoost:   number   // negative ms — more frequent when kitchen is active
  timerRunningBoost:   number   // negative ms — more vigilant when timer is live
  recentSpeechPenalty: number   // positive ms — back off after Gemini just spoke
  silenceBonus:        number   // negative ms — longer silence = more worth checking
}

function calculateInterval(
  baseInterval:    number,   // ms from phase
  silenceMs:       number,
  changeScore:     number,   // 0-100 from visual change detector
  hasActiveTimer:  boolean,
  msSinceGeminiSpoke: number | null,
): number {
  let interval = baseInterval

  // Visual activity — kitchen is active, check more often
  if (changeScore > 40) interval -= 4_000
  if (changeScore > 70) interval -= 4_000   // stacks: very active = -8s total

  // Timer running — something is cooking, stay more alert
  if (hasActiveTimer) interval -= 5_000

  // Long silence — user has been quiet a long time, they're deep in cooking
  if (silenceMs > 60_000) interval -= 3_000
  if (silenceMs > 120_000) interval -= 3_000   // stacks: very long silence = -6s total

  // Gemini just spoke — back off
  if (msSinceGeminiSpoke !== null && msSinceGeminiSpoke < 60_000) {
    interval += (60_000 - msSinceGeminiSpoke)  // full 60s recovery from last speech
  }

  // Hard floor: never check more often than every 8 seconds
  return Math.max(8_000, interval)
}
```

---

## Example Intervals by Situation

| Situation | Base | Modifiers | Final Interval |
|---|---|---|---|
| Prep phase, user quiet 20s | 20s | none | 20s |
| Active phase, timer running, high change | 12s | -5s (timer) -8s (change) | 8s (floor) |
| Simmering, low change, no timer | 60s | none | 60s |
| Simmering, timer running | 60s | -5s (timer) | 55s |
| Active, Gemini just spoke 10s ago | 12s | +50s (recent speech) | 62s |
| Active, user silent 3 min, high change | 12s | -6s (silence) -8s (change) | 8s (floor) |

---

## Urgency Override — Bypasses the Interval

When the visual change detector emits `urgencySignal: true` (accelerating large change), the interval is bypassed completely. The engine triggers an immediate observation request regardless of when the last check was. The only remaining check is the suppression rules (see `06-suppression-rules.md`).

```typescript
tick(): ObservationRequest | null {
  // Urgency override — check immediately if visual urgency detected
  if (this.lastFrameAnalysis?.urgencySignal) {
    if (!this.suppressionRules.hardBlocked()) {
      return this.promptBuilder.buildUrgentPrompt()
    }
  }

  // Normal frequency check
  const msSinceLastCheck = Date.now() - (this.lastObservationAt ?? 0)
  const interval = this.calculateInterval()

  if (msSinceLastCheck < interval) return null
  if (this.suppressionRules.softBlocked()) return null

  return this.promptBuilder.buildAdvisoryPrompt(this.currentContext())
}
```

---

## Cooldown After Observation

After any observation request (urgent or advisory), the engine enforces a post-observation cooldown — even if the frequency would normally allow another check sooner:

- After an **urgent** observation: 20-second cooldown (let the user process the warning)
- After an **advisory** observation: 30-second cooldown (space between non-urgent comments)
- After Gemini's **response was silent** (filtered by response-filter): 10-second cooldown (still counts — we just didn't interrupt)

```typescript
private lastObservationAt: number = 0
private lastObservationUrgency: 'urgent' | 'advisory' | 'silent' = 'silent'

private postObservationCooldownMs(): number {
  switch (this.lastObservationUrgency) {
    case 'urgent':   return 20_000
    case 'advisory': return 30_000
    case 'silent':   return 10_000
  }
}
```

---

## Why 8 Seconds Is the Hard Floor

8 seconds is the minimum interval between proactive checks. This prevents the engine from hammering Gemini with observation requests in a high-urgency situation. Even for burning oil, Gemini needs a moment to respond to the first alert before receiving another one. 8 seconds is also the minimum that allows Gemini's first audio response to reach the user before the next check arrives.
