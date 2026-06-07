# Brioela Generative Grammar — Naming Law

## What This File Covers

How every token, primitive, composition, and renderer component is named. Names in this grammar
are not cosmetic — the AI reads the names to decide what to emit, so a vague or metaphor-only
name directly causes wrong UI. This file is a binding law, not a style preference.

---

## The Problem This Law Solves

A name like `whisper_note` reads beautifully to a human who already knows the system. But the
AI, seeing it cold in a schema, can misread it: *"is this a musical note? a paper note? a quiet
annotation?"* When the name is ambiguous, the model guesses, and the wrong composition gets
chosen. Pure metaphor is a liability at the selection layer.

The opposite failure is equally bad: a name like `text_block_2` is unambiguous but carries no
*intent*, so the model has nothing to reason about and the catalog reads like generic SDUI.

The law threads both: **every name must carry its function AND its intent, with no standalone
metaphor.** Long names are encouraged. Clarity beats brevity, always.

---

## The Law

### 1. Role first, metaphor anchored

The name must lead with the functional role. A metaphor may follow only when anchored to that
role — never alone.

```
Bad   (metaphor only):   whisper_note
Bad   (no intent):       caption_2
Good  (role + anchor):   supporting_whisper_caption
```

### 2. Self-describing without the description

A reader (human or AI) must understand roughly what the name does *before* reading its
description field. The description adds nuance; the name carries the gist.

### 3. Long is fine. Ambiguous is not.

There is no length budget. `single_metric_presented_as_focal_petal` is a better name than
`metric_petal` if it removes a guess. Optimize for zero ambiguity, not for short.

### 4. One naming spine across every layer

The same concept keeps the same root across enum value, schema, and component file:

```
enum / type value (AI sees):   supporting_whisper_caption     (snake_case)
schema file:                   supporting-whisper-caption.ts   (kebab-case)
renderer component:            SupportingWhisperCaptionNode    (PascalCase + suffix)
```

### 5. Suffix says what kind of thing it is

| Kind | Enum suffix | Component suffix | Example |
|---|---|---|---|
| Primitive (atom) | none | `Node` | `verdict_hero_headline` → `VerdictHeroHeadlineNode` |
| Composition (scene) | `_scene` | `Scene` | `single_focal_verdict_scene` → `SingleFocalVerdictScene` |
| Atmosphere (shader) | `_field` | `Field` | `verdict_bloom_field` → `VerdictBloomField` |
| Beat (choreography) | `_beats` | — | `slow_reverent_reveal_beats` |

### 6. No web-widget words, ever

Banned from every name: `card`, `button`, `panel`, `box`, `container`, `view`, `block`, `item`,
`widget`, `component`. These pull the whole system back toward generic UI. Use the grammar's
own vocabulary (scene, field, rail, thread, petal, stamp, moment, whisper, hero).

---

## Renames (apply across the grammar)

The illustrative names used in earlier files are upgraded under this law. Primitives:

| Old (ambiguous) | New (role + anchor) |
|---|---|
| `hero_line` | `verdict_hero_headline` |
| `whisper_note` | `supporting_whisper_caption` |
| `metric_petal` | `single_metric_focal_petal` |
| `reason_line` | `reason_because_line` |
| `swap_pair` | `swap_from_to_suggestion` |
| `mesa_grid` | `mesa_member_fit_grid` |
| `recipe_step_rail` | `recipe_step_horizontal_rail` |
| `memory_moment` | `food_memory_on_this_day_moment` |
| `discovery_stamp` | `discovery_shareable_stamp` |
| `ingredient_thread` | `ingredient_insight_thread` |

Compositions (scenes):

| Old | New |
|---|---|
| `single_focal_reveal` | `single_focal_verdict_scene` |
| `mesa_table` | `mesa_table_fit_overview_scene` |
| `memory_moment` (scene) | `food_memory_reverent_scene` |

---

## The Description Field Is Still The Real Steering Wheel

A clear name removes the *gross* mistakes. The `description` field on each catalog entry removes
the *fine* ones. Every entry carries:

- **What it is** — one plain sentence.
- **When to use it** — the situation that should trigger this choice.
- **Emotional register** — the mood it belongs to.
- **One example** — a gold instance (drives imitation; see `13-how-ai-selects.md`).

Name and description are a pair: the name gets the model to the right neighborhood, the
description gets it to the right door. Neither alone is enough.

---

## What Depends On This File

- `11-composition-catalog-and-scale.md` — every catalog entry is named under this law.
- `13-how-ai-selects.md` — names + descriptions are what the AI selects against.
- `18-code-package-structure.md` — file names follow the one-naming-spine rule.
