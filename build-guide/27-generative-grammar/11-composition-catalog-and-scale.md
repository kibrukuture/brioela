# Brioela Generative Grammar — Composition Catalog And Scale

## What This File Covers

The composition catalog — the art-directed scenes that carry Brioela's soul — and the honest
answer to the question every reviewer asks: *"Is this enough vocabulary to be beautiful, or are
we lowering the bar to something soulless?"* This file defines the layers of the vocabulary,
their target sizes, the combinatorial math, and the per-unit quality bar.

---

## The Mistake This File Exists To Prevent

The trap is thinking the grammar is "a few small components." It is not. The grammar has four
vocabulary layers, and confusing them makes the system look tiny when it is not:

| Layer | What it is | Should it be small? | Target size |
|---|---|---|---|
| Tokens | enums for every visual value (mood, tone, voice, spacing) | **Yes — small on purpose** | tight, fixed sets |
| Primitives | the atoms / words — in three layers: structural, expressive, domain | Mostly reusable | ~40 generic + ~20 domain (growing) |
| Compositions | the art-directed scenes — *where soul lives* | **No — generous and growing** | start ~30, grow to 80–150+ |
| Atmospheres | Skia shader families, each parameterized | Effectively infinite within taste | ~10–15 families |

Small tokens are a *feature* — they guarantee consistency. A small set of *compositions* would
be the failure. The two are not the same layer. And the "~60 primitives" is not 60 split across
features — it is ~40 generic atoms every feature reuses plus ~20 domain atoms that grow over
time. See `14-primitive-layers-and-reuse.md` for the full layering and why shopper, Bela, and
every future feature already have UI.

---

## Why Small Tokens Are Correct (Not Soulless)

Moods, tones, voices, and spacing values are deliberately few. This is the same reason a great
typeface ships a handful of weights, not a thousand: a tight, opinionated set is what makes
everything *look like the same beautiful family.* Infinite color choices produce mud. A fixed,
hand-tuned palette produces a brand. Minimalism at the token layer is the source of cohesion,
not the source of soullessness.

Soul does not come from *more values*. It comes from *better-art-directed compositions* and
*richer combinations.* That is the next two sections.

---

## Where Soul Actually Lives: Compositions

A composition is **not a tiny component.** It is a complete, hand-art-directed scene — a full
editorial layout with a focal point, deliberate asymmetry, expansive negative space (`space_2xl`),
a real type hierarchy, an atmosphere binding, and a choreographed entrance. A single composition
component may be hundreds of lines of Skia + Reanimated + layout. It is a *work of design*, not
a wrapper around a `<View>`.

Compositions are organized into **emotional/functional families** so the catalog grows without
becoming a flat junk drawer. Illustrative families (these are proposed groupings, to be filled
out in the catalog build):

- **Verdict family** — single focal truth, weighed truth, caution-with-care, celebration.
- **Insight family** — the quiet secondary explanation, the "first time you've met this," the reason-because.
- **Comparison family** — swap-from-to, before/after, cheaper-nearby.
- **Table family (Mesa)** — works-for-all, member-fit grid, one-member-conflict spotlight.
- **Recipe family** — step rail, technique spotlight, grandma-note, low-energy simple mode.
- **Memory family** — on-this-day, long-gap return, staple-count, first-time badge.
- **Story family** — savings story, weekly summary, journey recap.
- **Share family** — discovery stamp, shareable artifact framing.
- **Learning family (Kids)** — gentle explainer, playful fact reveal.

Each family holds several distinct, individually-gorgeous scenes. The families are also how the
AI navigates the catalog: it reasons "this is a memory moment" → picks within the Memory family.

---

## The Combinatorial Math (why "~30" is not 30 looks)

Expressive power is not the count of compositions. It is the **product** of every layer that
can vary independently. Illustrative, using conservative mature-system targets:

```
compositions (~60)  ×  moods (~9)  ×  atmosphere families (~12)
                    ×  beat sequences (~18)
≈ 116,000+ structurally distinct moments

… before:
  • atmosphere uniform ranges (continuous, per family)
  • slot content (the actual words, effectively unbounded)
  • voice register per scene
```

The result is an effectively unbounded space of moments where **every single one clears the
quality floor**, because every composition was art-directed to be beautiful with any content.
This is the alphabet argument made literal: 26 letters → every book ever written, none of them
"the same letters." A small token set + a generous composition set is *exactly* how you get
infinite variety that is never ugly.

So the honest answer: the *initial* "~25" number floated in conversation was a starting point,
not the ceiling. The mature catalog is generous and ever-growing — and even modest counts
multiply into hundreds of thousands of distinct, on-brand moments.

---

## The Per-Unit Quality Bar (the real anti-soulless guarantee)

Quantity multiplies, but quality is set per-composition. Every composition must clear this bar
before it enters the catalog (this extends the promotion checklist in
`08-build-time-creation-lane.md`):

- Has a single, unambiguous focal point.
- Uses generous, intentional negative space (spacing tokens, never cramped).
- Has a dramatic type hierarchy (a real `typography_display` moment where appropriate).
- Looks beautiful with the *longest* allowed content and the *shortest*.
- Looks beautiful with empty/optional slots omitted.
- Binds to at least one atmosphere and one beat sequence tastefully.
- Handles dark mode and reduced motion.
- Pulls every value from the design system — zero raw numbers.

A composition that merely "works" does not ship. A composition that is not beautiful on its own
is a bug, not a primitive.

---

## Is This A Framework Or A Few Components?

It is a framework. It has: a typed document model (the Stage), a discriminated-union scene
system, a four-layer vocabulary, a token system, an atmosphere/shader engine, a choreography
engine, per-surface allowlists, a shared schema that is the single source of truth across
backend + iOS + Android + PWA, a validate/repair runtime, and a tool surface the AI calls. That
is a domain-specific UI language with a runtime — internally named **Brioela Generative
Grammar.** "A few components" is the renderer's leaf layer, not the system.

---

## Growth Model

The catalog is append-first and ever-growing (registry policy, `08`). New compositions arrive
through the build-time creation lane: AI proposes, humans art-direct and review against the
quality bar, the scene is added to the catalog, shipped, and only then can the runtime AI select
it. The vocabulary expands over the life of the product without the runtime ever shipping code.

---

## What This File Depends On

- `10-the-stage-document.md` — `composition` and `slots` are the layers this catalog fills.
- `03-primitive-families.md` — the atoms that compositions are built from.
- `14-primitive-layers-and-reuse.md` — the three primitive layers and the reuse model.
- `08-build-time-creation-lane.md` — how new compositions enter the catalog.

## What Depends On This File

- `12-naming-law.md` — how every composition and primitive is named for AI clarity.
- `13-how-ai-selects.md` — how the AI chooses a composition from the catalog.
