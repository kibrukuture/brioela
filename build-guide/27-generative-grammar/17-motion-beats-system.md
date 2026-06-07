# Brioela Generative Grammar — Motion / Beats System

## What This File Covers

The `beats` layer: how a Stage's entrance is choreographed over time, how beats differ from
motion tokens, the beat-sequence shape, the Reanimated mapping, the reduced-motion contract, and
how beats stay in sync with the atmosphere. Builds on the motion tokens in
`04-emotion-motion-skia.md` and the atmosphere system in `16-atmosphere-skia-system.md`.
Substrate facts are in `research/05-expressive-artistic-ui.md`.

---

## Beats vs Motion Tokens

Two different things, often confused:

- **Motion token** (`04`) — a single named *movement quality* applied to one node or the
  atmosphere: `breath`, `soft_lift`, `slow_reveal`, `field_bloom`, etc. It answers "how does
  this one thing move?"
- **Beats** — the *orchestrated sequence and timing* across the whole composition: what reveals
  first, what follows, how staggered. It answers "in what rhythm does the scene arrive?"

Beats are what make a moment feel *directed* instead of everything-appears-at-once. This is the
choreography layer.

---

## The Beat Sequence Shape

```typescript
type BeatSequence = {
  preset: BeatToken              // a named {character}_{pace}_beats sequence
  stagger: StaggerToken          // bounded gap between steps (an ordinal token, not raw ms)
}
```

A `preset` is a hand-authored ordered sequence: each step targets a slot/role in the
composition, applies a motion token, and has a relative delay. The AI selects the preset and a
stagger token — it never authors raw timings or curves. Like the rest of the grammar: choose
from a beautiful closed set, don't hand-tune numbers.

Target ~15–20 presets. New presets arrive through the build-time creation lane (`08`).

Starting set (names follow the `{character}_{pace}_beats` grammar in `12`):

- `reveal_slow_beats`
- `lift_soft_beats`
- `bloom_warm_beats`
- `settle_calm_beats`
- `cascade_gentle_beats`

---

## The Reveal Model

Beats choreograph the **enhancement entrance**, not a re-layout:

1. Tier-0 static UI is already on screen.
2. A valid Stage arrives within the 400ms budget (`15`).
3. The composition mounts and its `beats` play the entrance — focal element first, supporting
   elements staggered after.
4. No janky reflow: the static and enhanced layouts are designed to transition cleanly, or the
   enhanced scene replaces the static region with its own choreographed mount.

If the Stage misses the budget, none of this runs — static simply stays. Beats are additive
delight, never a blocker.

---

## Implementation

- **Reanimated 4 (4.4+)** as the motion driver (`research/05`): reworked spring physics
  (specify duration + damping ratio), CSS-compatible declarative animations, entering/layout
  animations, and shared-element transitions (4.2+).
- On iOS, the **Core Animation engine (4.4)** runs eligible animations off the JS update loop —
  buttery 60fps choreography.
- **Worklets** (`react-native-worklets`) for any gesture-driven or interruptible motion.
- Beats and atmosphere are driven by the **same Reanimated shared values** (`16`), so the
  background field and the foreground reveal move as one — no drift, no bridge glue.
- Requires the New Architecture (default in current Expo SDKs) (`research/05`).

---

## Reduced-Motion Contract

Non-negotiable accessibility behavior:

- When the OS reduced-motion setting is on, beats collapse to **opacity-only or instant** —
  content appears without translation/scale/spring.
- Reduced motion is also the floor when the atmosphere is at degradation level 2+ (`16`), so the
  whole Stage stays coherent (still field + still entrance).
- Motion is never required to understand a moment. A beat-less render is always complete.

---

## Pairing Rules

- Each `mood` implies an allowed set of beat presets (`04` pairing rules); illegal pairings fail
  validation step 6 (`15`). E.g. `gentle_learning` uses soft presets, never an urgent cascade;
  `urgent_lock` motion is reserved for static safety surfaces and is never an AI-selected beat.
- A beat preset must be compatible with the chosen composition's slot roles; an incompatible
  preset fails closed.

---

## Performance

Choreography runs at 60fps by leaning on the off-JS-thread engines (Core Animation on iOS,
worklets elsewhere). Total animated nodes are bounded by the Stage size caps (`15`), so a scene
can never schedule a runaway number of concurrent animations.

---

## What This File Depends On

- `04-emotion-motion-skia.md` — the motion tokens beats sequence.
- `16-atmosphere-skia-system.md` — shared values drive both layers.
- `01-design-system` — spring configs and motion primitives.
- `research/05-expressive-artistic-ui.md` — Reanimated 4 capabilities.

## What Depends On This File

- `10-the-stage-document.md` — the `beats` layer references this system.
- `15-validation-and-repair.md` — pairing and preset-compatibility checks.
