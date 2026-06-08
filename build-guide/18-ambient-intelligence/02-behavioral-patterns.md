# Ambient Intelligence — Behavioral Patterns

## What This File Covers

Passive food behavior behavior pattern detection: wellbeing signals, evidence windows, confidence thresholds, intervention candidates, and strict boundaries against mood tracking or medical claims.

---

## Core Rule

The user never logs mood, rates energy, or fills out a wellbeing form.

Signals come from interactions the user is already having:

- cooking sessions
- voice sessions
- scan conversations
- receipt history
- illness reports
- product scans
- recipe activity

Brioela listens for useful food-related patterns. It does not become a tracking chore.

---

## Wellbeing Signal Capture

During voice or cooking sessions, transcripts can contain organic wellbeing language:

- "I'm exhausted today."
- "My stomach feels off."
- "I had a lot of energy this morning."
- "That meal made me feel heavy."

The transcript processor writes a `wellbeing_signal` event only when the user naturally says it. The assistant should not ask daily check-in questions.

```typescript
type WellbeingSignal = {
  signalId: string
  userId: string
  signalType: "energy_low" | "energy_high" | "stomach_discomfort" | "mood_low" | "mood_positive"
  sourceSession: string
  foodContext: {
    lookbackHours: 12 | 24 | 48
    scanEventIds: string[]
    receiptEventIds: string[]
    recipeIds: string[]
  }
  capturedAt: number
}
```

`mood_low` and `mood_positive` are allowed as context signals, but they must not produce mental-health claims.

---

## Pattern Types

Supported patterns:

| Pattern | Evidence |
|---|---|
| `energy_correlation` | repeated food/category before low or high energy signals |
| `stress_eating` | late-night scans or repeated comfort purchases around stress language |
| `post_sickness_association` | recurring foods/categories near illness reports |
| `aversion` | repeated rejection or avoidance of ingredient/brand/category |
| `dietary_drift` | gradual change away from prior regular foods |
| `travel_food_preparation` | pre-trip purchasing/scanning shifts |

Every pattern needs explicit evidence. No soft vibes.

---

## Evidence Thresholds

The spec requires at least 5 consistent signal instances before a pattern is written.

Thresholds:

- Wellbeing/health correlation: minimum 5 consistent instances, confidence >= 0.75.
- Stress eating: minimum 5 instances across at least 2 weeks, confidence >= 0.7.
- Aversion: minimum 4 repeated avoid/reject signals, confidence >= 0.65.
- Dietary drift: minimum 30 days of changed behavior, confidence >= 0.7.
- Post-sickness association: minimum 3 illness-linked instances, but only as a soft candidate, never a cause claim.

The general BehaviorPatternAgent rule from `05-brain/04-sub-agents.md` allows 3 evidence points for lower-risk patterns. Ambient wellbeing patterns use stricter thresholds.

---

## Pattern Record

```typescript
type BehaviorPattern = {
  patternId: string
  userId: string
  patternType: "energy_correlation" | "stress_eating" | "post_sickness_association" | "aversion" | "dietary_drift" | "travel_food_preparation"
  evidenceEventIds: string[]
  summary: string
  confidence: number
  firstSeenAt: number
  lastSeenAt: number
  status: "candidate" | "active" | "dismissed" | "stale"
}
```

Patterns can be stored as explicit tables if implemented, or as structured `user_memory` under `patterns.*` once active. Candidate patterns should not be loaded into prompts until they pass the threshold.

---

## Intervention Candidate

Behavior behavior pattern detection does not immediately interrupt the user.

It creates an intervention candidate:

```typescript
type PatternInterventionCandidate = {
  patternId: string
  suggestedLine: string
  surface: "conversation" | "scan_inline" | "weekly_summary"
  maxSurfaceAfter: number
  surfacedAt: number | null
}
```

Example copy:

```text
I've noticed you often mention feeling sluggish the day after meals with heavy cream. Want me to keep an eye on that?
```

This is a question and observation, not a diagnosis.

---

## Surfacing Limits

Rules:

- Maximum one new pattern insight per week.
- Surface during an already relevant conversation when possible.
- Do not push pattern insights as standalone notifications.
- If dismissed twice, suppress that pattern family for 14 days.
- If the user rejects the pattern, mark it dismissed and stop surfacing it.

The user should feel helped, not watched.

---

## Medical And Mental Health Boundary

Allowed:

- "I've noticed a possible pattern."
- "This seems to happen often after [food/category]."
- "Want me to keep an eye on it?"

Blocked:

- "This food causes your fatigue."
- "You are stress eating."
- "This is a mental health pattern."
- "You should stop eating this for medical reasons."

Behavioral patterns are hypotheses for the user to confirm or ignore.
