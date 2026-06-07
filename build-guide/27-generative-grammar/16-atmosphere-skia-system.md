# Brioela Generative Grammar — Atmosphere / Skia System

## What This File Covers

The Tier-2 atmosphere layer: the Skia shader families behind a Stage, the uniform contract that
lets the AI nudge them safely, mood/tone binding, web parity, performance/degradation, and the
hard boundary that keeps it safe. Builds on the `SkiaTreatment` tokens in
`04-emotion-motion-skia.md` and Tier 2 in `09-generativity-tiers.md`. Substrate facts are in
`research/05-expressive-artistic-ui.md`.

---

## The Principle: Generative Art Without Generative Code

The atmosphere is where "out of this world" lives — and the place most likely to go wrong if the
AI gets too much freedom. The rule:

> The AI selects an atmosphere **token** and may nudge a few **uniforms within safe ranges.** It
> never writes shader code. Every shader is hand-authored, so the output is always tasteful, and
> the parameter space is large enough to feel alive and never-repeating.

This is the same shape as the rest of the grammar: a closed, beautiful vocabulary the AI
arranges, not a canvas it paints on.

---

## Atmosphere Families

The `{character}_field` tokens from `04` are the families. Target ~10–15 mature families. Each
is a hand-authored SkSL shader (or layered shader stack) with a small set of exposed uniforms.

Starting set:

- `none`
- `ambient_grain_field`
- `verdict_bloom_field`   *(tone token tints safe vs caution — not separate shaders)*
- `memory_glow_field`
- `mesa_table_field`
- `discovery_sheen_field`

New families arrive only through the build-time creation lane (`08`): authored, reviewed against
the quality bar, shipped in the binary, then selectable at runtime.

---

## The Uniform Contract

An atmosphere is selected as the Stage's `atmosphere` layer:

```typescript
type AtmosphereSelection = {
  family: AtmosphereToken          // one of the {character}_field tokens
  intensity: IntensityToken        // a bounded scale, not a raw float
  tone: ToneToken                  // tints the field (safe / caution / memory / …)
}
```

Key safety rules:

- The AI passes **tokens**, never raw SkSL, never raw float uniforms.
- `intensity` is an ordinal token (`space_*`-style scale), mapped on the client to a clamped
  uniform range the shader author defined. The AI cannot exceed the safe range.
- Out-of-range or unknown family → validation fails closed (`15`); the static UI stays.

---

## Mood And Tone Binding

- **Mood sets the default.** Each `mood` implies a default atmosphere family and intensity, so a
  Stage that omits `atmosphere` still looks intentional (`10`, mood-first read order).
- **Tone tints, never restyles.** `tone` shifts color/temperature within the family; it cannot
  change the family's character.
- **Pairing is validated.** Illegal mood↔atmosphere pairings (e.g. `reverent_memory` with an
  urgent field) fail at step 6 of validation (`04`, `15`).

---

## Implementation

- **Skia 2.6.x** as the visual engine; SkSL runtime shaders via `RuntimeEffect.Make`; gradients,
  blurs, and non-separable blend modes for layered compositing (`research/05`).
- **Reanimated shared values feed Skia props directly** — no `createAnimatedComponent`/bridge
  glue — so an atmosphere animates in lockstep with the Stage's `beats` (`17`).
- Stay on the **Ganesh** backend. Graphite/WebGPU is experimental and not for production yet
  (`research/05`).

---

## Performance And Degradation

The atmosphere must never cost the moment. Degradation ladder:

1. **Full** — animated SkSL field at the device frame rate.
2. **Reduced** — on low-end devices or thermal/battery pressure, the field renders **static**
   (one composed frame), no animation.
3. **Fallback** — if Skia is unavailable or errors, a plain design-system gradient/solid stands
   in. The Stage still renders; only the atmosphere downgrades.

Reduced-motion (OS setting) forces at least level 2: atmospheres hold still. Content is never
blocked on the atmosphere — it is the backdrop, not the message.

---

## Web / PWA Parity

The same SkSL runs on web via **CanvasKit (WASM)** (`research/05`), so PWA renders the same
atmosphere families from the same Stage. One grammar, one visual language across iOS, Android,
and web — no separate web atmosphere system.

---

## The Boundary

- No raw shader code, no raw uniforms at runtime — tokens and clamped scales only.
- All families ship in the app binary; the runtime AI can reference but never define them.
- Atmosphere is Tier 2 only — it never renders or overlaps a Tier-0 safety surface (`09`).

---

## What This File Depends On

- `04-emotion-motion-skia.md` — the `{character}_field` tokens and pairing rules.
- `09-generativity-tiers.md` — Tier 2 definition.
- `01-design-system` — gradients, palette, and fallback visuals.
- `research/05-expressive-artistic-ui.md` — Skia 2.6.x capabilities and constraints.

## What Depends On This File

- `10-the-stage-document.md` — the `atmosphere` layer references this system.
- `17-motion-beats-system.md` — beats and atmosphere animate from the same shared values.
- `15-validation-and-repair.md` — uniform-range and pairing checks.
