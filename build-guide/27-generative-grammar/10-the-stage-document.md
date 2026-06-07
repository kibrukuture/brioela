# Brioela Generative Grammar — Brioela Generative UI Document

## What This File Covers

The Brioela Generative UI document: Brioela's central generative document. Earlier drafts called
this a "Stage" as a theater metaphor. Code, contracts, and API responses must not use that poetic
term. Use `BrioelaGenerativeUiDocument` and `brioelaGenerativeUi`.

This document extends the base `BrioelaGenerativeUiDocument` from `02-grammar-document.md` with the six
expressive layers that make a moment feel art-directed instead of assembled. This file defines the
shape; the catalog of what can go in each layer is in `11-composition-catalog-and-scale.md`.

---

## Naming Decision

The theatrical "Stage" metaphor is retained only as historical context. It is not used in code.

Use:

```typescript
type BrioelaGenerativeUiDocument = { ... }
```

Use response field:

```typescript
brioelaGenerativeUi
```

Use renderer:

```tsx
<BrioelaGenerativeUiRenderer document={brioelaGenerativeUi} fallback={...} />
```

---

## The Six Layers

A Brioela Generative UI document is the base document plus six explicit layers:

| Layer | Question it answers | Controls |
|---|---|---|
| `emotionalTone` | What should this feel like? | palette, emphasis, motion + background defaults |
| `backgroundEffect` | What visual field sits behind the content? | the Tier-2 Skia field (shader family + safe uniforms) |
| `layoutTemplate` | Which approved layout scene renders this? | the art-directed scene (discriminated union) |
| `content` | What text/data fills the chosen layout? | the meaning the AI writes into typed fields |
| `entranceMotion` | How does it enter/reveal? | the Reanimated motion sequence |
| `typographyStyle` | Which type hierarchy/register does it use? | the typography style (`typography_display` / `typography_title` / `typography_body` / `typography_caption`) |

The split is the whole point: **the AI controls `emotionalTone`, `layoutTemplate` choice,
`backgroundEffect`, `entranceMotion`, `typographyStyle`, and writes `content` — but it never
controls a pixel, a color, a size, or a position.** Those belong to the layout template component
and the design system.

---

## Document Shape (extends `02`)

```typescript
type BrioelaGenerativeUiDocument = {
  // base contract (from 02-grammar-document.md)
  grammarVersion: string
  surface: GenerativeSurface
  safetyLock: boolean
  expiresAt: number | null

  // the six expressive layers
  emotionalTone: EmotionalTone                // see 04-emotion-motion-skia.md
  backgroundEffect: BackgroundEffectSelection // Tier 2; see 16-atmosphere-skia-system.md
  layoutTemplate: LayoutTemplate              // discriminated union; see 11-composition-catalog-and-scale.md
  content: BrioelaGenerativeUiContent         // shape determined by the chosen layoutTemplate
  entranceMotion: EntranceMotion              // see 17-motion-beats-system.md
  typographyStyle: TypographyStyle            // typography register
}
```

`layoutTemplate` is a **discriminated union** keyed on a `type` field. This is the single most
important structural decision: it is *how the AI chooses a layout* — by selecting one tag and
filling that tag's content. See `13-how-ai-selects.md`.

---

## How The Document Is Read

1. `emotionalTone` is read first — it sets the defaults for everything else, so the document is internally
   consistent even if other layers are sparse.
2. `backgroundEffect` lays down the Tier-2 field behind the scene.
3. `layoutTemplate` selects the art-directed scene component.
4. `content` is poured into the scene's typed fields, validated for length and tone.
5. `entranceMotion` choreographs the entrance.
6. `typographyStyle` selects the type register for the scene's text roles.

Any layer except `layoutTemplate` may be omitted; the renderer falls back to the `emotionalTone`
default for that layer. `layoutTemplate` and its required `content` are the only hard requirements.

---

## Internal Consistency Rules

These are enforced at validation (see `15-validation-and-repair.md`):

- An `emotionalTone` implies an allowed set of `backgroundEffect`, `entranceMotion`, and `typographyStyle`. Invalid pairings fail
  (e.g. `memory_reflective` cannot pair with an urgent background effect). Pairing rules live in
  `04-emotion-motion-skia.md`.
- A `layoutTemplate` declares which `content` fields are required and their length caps.
- `surface` declares which `layoutTemplate` types are permitted (per-surface allowlist).
- `safetyLock = true` forbids any layout template that could overlap a Tier-0 region.

---

## Why This Is Not Just "JSON With Components"

The Brioela Generative UI document is a typed document model with: a discriminated-union layout template system, a token system
for every visual value, a motion sequence layer, a background effect layer, per-surface allowlists, and
a validate/repair runtime. That is a domain-specific UI language with a compiler-like
validation step and a renderer runtime — a framework, not a payload format. See
`11-composition-catalog-and-scale.md` for why the *vocabulary* is large enough to have soul.

---

## What This File Depends On

- `02-grammar-document.md` — the base document contract this extends.
- `04-emotion-motion-skia.md` — mood, tone, motion, haptic, Skia token definitions.

## What Depends On This File

- `11-composition-catalog-and-scale.md` — the catalog that fills `layoutTemplate` and `content`.
- `13-how-ai-selects.md` — how the AI emits a valid Brioela Generative UI document.
- `05-renderer-and-fallback.md` — how the document is rendered or discarded.
