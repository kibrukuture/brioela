# Bela — Cooking Intent Trigger

## What This File Covers

How cooking or recipe gaps can become a Bela order.

## Sources

- `implementable-specs/bela/10-cooking-intent-trigger.md`
- `build-guide/08-cooking-session/`

## Sources Of Intent

- active cooking session missing ingredient
- recipe save
- user voice request
- pantry gap from meal plan

## Event

Add memory event kind:

```text
cooking_intent
```

Payload includes:

- dish
- timeframe
- confidence
- missing ingredients

## Flow

1. Detect missing ingredient/order intent.
2. User approves order draft.
3. Bela order uses normal order flow.
4. After delivery, user can start cooking session.
