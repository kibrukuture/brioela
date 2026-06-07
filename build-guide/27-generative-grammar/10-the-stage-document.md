# Brioela Generative Grammar — The Stage Document

## What This File Covers

The Stage: Brioela's central generative document. This extends the base `GenerativeUIDocument`
from `02-grammar-document.md` with the six expressive layers that make a moment feel
art-directed instead of assembled. This file defines the *shape*; the catalog of what can go in
each layer is in `11-composition-catalog-and-scale.md`.

---

## Why "Stage" And Not "Document"

We borrow from theater and cinema, not from the web. There is no `div`, no `card`, no `button`
anywhere in the vocabulary. A moment is a **Stage**: a lit space, a composed scene, a
choreographed reveal, a voice. This framing is deliberate — it keeps both the AI and the
developer thinking in emotional/compositional terms, not in web-widget terms, which is the
first defense against soulless UI.

---

## The Six Layers

A Stage is the base document plus six expressive layers:

| Layer | Question it answers | Controls |
|---|---|---|
| `mood` | What does this moment *feel* like? | palette, emphasis, motion + atmosphere defaults |
| `atmosphere` | What is *behind* everything? | the Tier-2 Skia field (shader family + safe uniforms) |
| `composition` | How is the scene *laid out*? | the art-directed scene (discriminated union) |
| `slots` | What *content* fills the scene? | the meaning the AI writes into named holes |
| `beats` | How does it *reveal* over time? | the Reanimated choreography sequence |
| `voice` | What *typographic register*? | the type register (`voice_display` / `voice_title` / `voice_body` / `voice_caption`) |

The split is the whole point: **the AI controls `mood`, `composition` choice, `atmosphere`
selection, `beats`, and writes the `slots` — but it never controls a pixel, a color, a size, or
a position.** Those belong to the composition component and the design system.

---

## Document Shape (extends `02`)

```typescript
type Stage = {
  // base contract (from 02-grammar-document.md)
  grammarVersion: string
  surface: GenerativeSurface
  safetyLock: boolean
  expiresAt: number | null

  // the six expressive layers
  mood: UIMood                      // see 04-emotion-motion-skia.md
  atmosphere: AtmosphereSelection   // Tier 2; see 16-atmosphere-skia-system.md
  composition: CompositionNode      // discriminated union; see 11-composition-catalog-and-scale.md
  slots: SlotContent                // shape determined by the chosen composition
  beats: BeatSequence               // see 17-motion-beats-system.md
  voice: VoiceRegister              // typography register
}
```

`composition` is a **discriminated union** keyed on a `type` field. This is the single most
important structural decision: it is *how the AI chooses a layout* — by selecting one tag and
filling that tag's slots. See `13-how-ai-selects.md`.

---

## How A Stage Is Read

1. `mood` is read first — it sets the defaults for everything else, so a Stage is internally
   consistent even if other layers are sparse.
2. `atmosphere` lays down the Tier-2 field behind the scene.
3. `composition` selects the art-directed scene component.
4. `slots` are poured into the scene's named holes, validated for length and tone.
5. `beats` choreograph the entrance.
6. `voice` selects the type register for the scene's text roles.

Any layer except `composition` may be omitted; the renderer falls back to the `mood` default
for that layer. `composition` and its required `slots` are the only hard requirements.

---

## Internal Consistency Rules

These are enforced at validation (see `15-validation-and-repair.md`):

- A `mood` implies an allowed set of `atmosphere`, `beats`, and `voice`. Invalid pairings fail
  (e.g. `reverent_memory` cannot pair with an urgent atmosphere). Pairing rules live in
  `04-emotion-motion-skia.md`.
- A `composition` declares which `slots` are required and their length caps.
- `surface` declares which `composition` types are permitted (per-surface allowlist).
- `safetyLock = true` forbids any composition that could overlap a Tier-0 region.

---

## Why This Is Not Just "JSON With Components"

The Stage is a typed document model with: a discriminated-union scene system, a token system
for every visual value, a choreography layer, an atmosphere layer, per-surface allowlists, and
a validate/repair runtime. That is a domain-specific UI language with a compiler-like
validation step and a renderer runtime — a framework, not a payload format. See
`11-composition-catalog-and-scale.md` for why the *vocabulary* is large enough to have soul.

---

## What This File Depends On

- `02-grammar-document.md` — the base document contract this extends.
- `04-emotion-motion-skia.md` — mood, tone, motion, haptic, Skia token definitions.

## What Depends On This File

- `11-composition-catalog-and-scale.md` — the catalog that fills `composition` and `slots`.
- `13-how-ai-selects.md` — how the AI emits a valid Stage.
- `05-renderer-and-fallback.md` — how the Stage is rendered or discarded.
