# Wearables — Feature Integration

## What This File Covers

How wearable-derived facts improve existing Brioela features: scanner, pantry/meal plan, ambient intelligence, illness detective, and cooking sessions.

---

## Scanner

Scanner can show a wearable overlay after the standard verdict.

Order:

1. Hard allergy and safety constraints.
2. Base scan verdict.
3. Personal glucose/recovery overlay if available.

Wearable data never downgrades a hard allergy. It only adds personal context.

Examples:

- "Your past glucose response to this product has been high."
- "This has been a flatter option for you than similar snacks."
- "No personal glucose data yet."

---

## Pantry And Meal Plan

Meal planning can use wearable state as a modifier.

Inputs:

- readiness score
- sleep quality
- activity level
- planned workout context when available
- personal glucose spike triggers

Behavior:

- low recovery → prefer low-effort meals
- poor sleep → avoid complex/high-attention cooking suggestions
- high activity/workout day → allow higher-energy meals if constraints permit
- CGM spike triggers → favor flatter alternatives

Do not override budget, pantry, or hard constraints. Wearables influence ranking, not safety rules.

---

## Ambient Intelligence

Wearables corroborate passive wellbeing signals.

Example:

- User says "I'm exhausted" in voice session.
- HRV is down and sleep quality was poor.
- Ambient pattern confidence increases.

Wearables can also reduce confidence:

- User says they feel low-energy, but sleep/recovery are normal.
- Pattern remains conversational evidence only.

This helps avoid overfitting to language alone.

---

## Illness Detective

Wearables can add early physiological context.

Signals:

- elevated resting heart rate
- body temperature deviation
- sleep disruption
- low recovery/readiness

Use only as supporting evidence.

Allowed:

```text
Your wearable shows elevated temperature and resting heart rate, which can support that something is going on. This does not identify the cause.
```

Blocked:

```text
Your wearable proves food poisoning.
```

Illness Detective still ranks food suspects from food history, recalls, community illness clusters, and symptom timing.

---

## Cooking Session

Cooking Agent can adapt tone and recipe complexity.

Examples:

- "Looks like a low-recovery day. Want a simpler version?"
- "You slept poorly, so I'll keep the steps low-effort."
- "This recipe uses a food that has spiked you before. Want an alternative?"

Rules:

- Mention wearable context sparingly.
- Do not start sessions by reading health stats aloud.
- Ask before adapting if the adaptation changes the dish meaningfully.
- Never imply medical treatment.

---

## Notifications

Wearable-driven surfacing follows `12-notifications`.

Generally allowed:

- in-app suggestion
- scan overlay
- cooking-session conversational line
- weekly summary observation

Generally blocked:

- push notifications for normal sleep/recovery changes
- emergency alerts
- fear-based glucose messages
- repeated wearable nagging

Wearables should make Brioela more context-aware, not more interruptive.
