# Brioela Generative Grammar — Emotion, Motion, And Skia

## What This File Covers

How emotional tone, Reanimated motion, haptics, and Skia visual treatments are represented as safe grammar tokens.

---

## Emotional Tokens

```typescript
type UIMood =
  | "plain_truth"
  | "quiet_discovery"
  | "warm_caution"
  | "soft_celebration"
  | "reverent_memory"
  | "focused_cooking"
  | "gentle_learning"
  | "table_care"
  | "savings_relief"
```

Mood controls tone, emphasis, motion, and atmospheric defaults. Mood never changes safety verdicts.

---

## Tone Tokens

```typescript
type ToneToken =
  | "neutral"
  | "safe"
  | "caution"
  | "danger"
  | "memory"
  | "child_warm"
  | "mesa"
  | "savings"
```

Tone tokens map to design-system color and typography variants.

---

## Motion Tokens

```typescript
type MotionToken =
  | "none"
  | "breath"
  | "soft_lift"
  | "slow_reveal"
  | "warm_pulse"
  | "field_bloom"
  | "urgent_lock"
```

Motion is implemented with Reanimated/Moti using existing design-system spring configs.

The AI cannot pass raw animation values.

---

## Haptic Tokens

```typescript
type HapticToken =
  | "none"
  | "light_presence"
  | "soft_confirm"
  | "caution_tap"
  | "hard_stop"
```

Haptics follow `01-design-system/08-haptics.md`.

Hard safety haptics are static and not chosen by generative grammar.

---

## Skia Treatments

```typescript
type SkiaTreatment =
  | "none"
  | "ambient_grain"
  | "verdict_bloom_safe"
  | "verdict_bloom_caution"
  | "memory_glow"
  | "mesa_table_field"
  | "discovery_sheen"
```

Skia treatments are prebuilt shader/layer configurations. The AI selects tokens only.

---

## Pairing Rules

- `urgent_lock` only for static safety surfaces controlled by the feature, not AI-selected generative flavor.
- `soft_celebration` can use `warm_pulse` or `field_bloom`.
- `reverent_memory` can use `memory_glow` and slow reveal.
- `gentle_learning` uses soft lift, never urgent motion.
- `table_care` can use `mesa_table_field`.

Invalid pairings fail validation.
