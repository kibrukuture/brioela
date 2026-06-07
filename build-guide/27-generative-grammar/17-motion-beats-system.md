# Brioela Generative Grammar — Entrance Motion System

## What This File Covers

The `entranceMotion` layer: how a Brioela Generative UI document's entrance is choreographed over time, how entrance motion differs from
motion tokens, the motion-sequence shape, the Reanimated mapping, the reduced-motion contract, and
how entrance motion stays in sync with the background effect. Builds on the motion tokens in
`04-emotion-motion-skia.md` and the background effect system in `16-atmosphere-skia-system.md`.
Substrate facts are in `research/05-expressive-artistic-ui.md`.

---

## Entrance Motion vs Motion Tokens

Two different things, often confused:

- **Motion token** (`04`) — a single named *movement quality* applied to one node or the
  background effect: `breath`, `soft_lift`, `slow_reveal`, `field_bloom`, etc. It answers "how does
  this one thing move?"
- **Entrance motion** — the *orchestrated sequence and timing* across the whole layout template: what reveals
  first, what follows, how staggered. It answers "in what rhythm does the scene arrive?"

Entrance motion is what makes a moment feel *directed* instead of everything-appears-at-once. This is the
choreography layer.

---

## The Entrance Motion Shape

```typescript
type EntranceMotion = {
  preset: EntranceMotionToken    // a named {character}_{pace}_entrance sequence
  stagger: StaggerToken          // bounded gap between steps (an ordinal token, not raw ms)
}
```

A `preset` is a hand-authored ordered sequence: each step targets a content role in the
layout template, applies a motion token, and has a relative delay. The AI selects the preset and a
stagger token — it never authors raw timings or curves. Like the rest of the grammar: choose
from a beautiful closed set, don't hand-tune numbers.

Target ~15–20 presets. New presets arrive through the build-time creation lane (`08`).

Starting set (names follow the `{character}_{pace}_entrance` grammar):

- `reveal_slow_entrance`
- `lift_soft_entrance`
- `bloom_warm_entrance`
- `settle_calm_entrance`
- `cascade_gentle_entrance`

---

## The Reveal Model

Entrance motion choreographs the **enhancement entrance**, not a re-layout:

1. Tier-0 static UI is already on screen.
2. A valid Brioela Generative UI document arrives within the 400ms budget (`15`).
3. The layout template mounts and its `entranceMotion` plays the entrance — focal element first, supporting
   elements staggered after.
4. No janky reflow: the static and enhanced layouts are designed to transition cleanly, or the
   enhanced scene replaces the static region with its own choreographed mount.

If the document misses the budget, none of this runs — static simply stays. Entrance motion is additive
delight, never a blocker.

---

## Implementation

- **Reanimated 4 (4.4+)** as the motion driver (`research/05`): reworked spring physics
  (specify duration + damping ratio), CSS-compatible declarative animations, entering/layout
  animations, and shared-element transitions (4.2+).
- On iOS, the **Core Animation engine (4.4)** runs eligible animations off the JS update loop —
  buttery 60fps choreography.
- **Worklets** (`react-native-worklets`) for any gesture-driven or interruptible motion.
- Entrance motion and background effect are driven by the **same Reanimated shared values** (`16`), so the
  background field and the foreground reveal move as one — no drift, no bridge glue.
- Requires the New Architecture (default in current Expo SDKs) (`research/05`).

---

## Reduced-Motion Contract

Non-negotiable accessibility behavior:

- When the OS reduced-motion setting is on, entrance motion collapses to **opacity-only or instant** —
  content appears without translation/scale/spring.
- Reduced motion is also the floor when the background effect is at degradation level 2+ (`16`), so the
  whole document stays coherent (still field + still entrance).
- Motion is never required to understand a moment. A beat-less render is always complete.

---

## Pairing Rules

- Each `emotionalTone` implies an allowed set of entrance motion presets (`04` pairing rules); illegal pairings fail
  validation step 6 (`15`). E.g. `gentle_learning` uses soft presets, never an urgent cascade;
  `urgent_lock` motion is reserved for static safety surfaces and is never an AI-selected beat.
- An entrance motion preset must be compatible with the chosen layout template's content roles; an incompatible
  preset fails closed.

---

## Performance

Choreography runs at 60fps by leaning on the off-JS-thread engines (Core Animation on iOS,
worklets elsewhere). Total animated nodes are bounded by the Brioela Generative UI size caps (`15`), so a scene
can never schedule a runaway number of concurrent animations.

---

## What This File Depends On

- `04-emotion-motion-skia.md` — the motion tokens entrance sequence.
- `16-atmosphere-skia-system.md` — shared values drive both layers.
- `01-design-system` — spring configs and motion primitives.
- `research/05-expressive-artistic-ui.md` — Reanimated 4 capabilities.

## What Depends On This File

- `10-the-stage-document.md` — the `entranceMotion` layer references this system.
- `15-validation-and-repair.md` — pairing and preset-compatibility checks.
