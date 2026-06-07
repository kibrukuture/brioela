# Brioela Generative Grammar — Naming Law

## What This File Covers

How every token, primitive, layout template, background effect, and entrance motion is named. Names in this grammar
are not cosmetic — the AI reads the names to decide what to emit, so a vague, metaphorical, or
inconsistent name directly causes the wrong UI to render. This file is a binding law, not a
style preference, and it **supersedes** the illustrative names used in earlier files (`02`,
`03`, and any pre-rename example). Where they disagree, this file wins.

---

## Two Audiences, One Conflict

Every name serves two readers at once:

- **The AI selection layer** — needs total, unambiguous clarity. A name it can misread is a
  name that produces wrong UI.
- **The human / brand layer** — wants soul, poetry, the Brioela feeling.

The original instinct was to satisfy both in one name ("role first, metaphor anchored"). That
was wrong, and the reason is consistency: some names lean poetic, some don't, and **inconsistency
is exactly what confuses a model.** So the law separates the two audiences instead of
compromising between them.

---

## Core Decision: Metaphor Is Banned From The AI's Vocabulary

> The identifier the AI emits is **purely functional** and follows **one fixed positional
> grammar.** Metaphor never appears in an emitted string. It lives, if anywhere, only in an
> optional human-facing display label inside the design system — never in the enum the model
> selects.

`whisper_note` is gone. The AI cannot misread `caption`. `cathedral` is gone. The AI cannot
misread `space_2xl`. The model learns one predictable pattern and applies it everywhere.

---

## Soul Lives In Pixels, Not In Strings

The reassurance that makes this safe to do:

> A boring name does not make boring UI. The petal *shape*, the whisper *softness*, the bloom
> *glow* still exist — they live in the composition component's design (the Skia, the spacing,
> the type), not in the string the model types.

`metric_single` can render as a soft glowing petal. `caption` can render as the gentlest
hand-tuned whisper of type. The enum is ugly-clear; the rendered moment is gorgeous. Conflating
"beautiful names" with "beautiful UI" was the underlying error — they are different layers.
Ugly-clear names + stunning pixels is exactly the target.

---

## The Positional Grammar

One fixed structure per kind, so the AI never has to guess what shape a name takes:

| Kind | Grammar | Examples |
|---|---|---|
| Generative surface | `{feature}_{surface_role}_brioela_generative_ui` | `scan_explanation_brioela_generative_ui` · `cooking_opener_brioela_generative_ui` |
| Primitive (generic) | `{role}_{form}` | `metric_single` · `reason_statement` · `timestamped_note` |
| Primitive (domain) | `{feature}_{role}` | `recipe_step` · `mesa_member_row` · `ingredient_list` |
| Composition (scene) | `{surface}_{intent}_{layout}` | `scan_verdict_focus` · `mesa_fit_grid` · `memory_recall_reverent` |
| Atmosphere (shader) | `{character}_field` | `ambient_grain_field` · `verdict_bloom_field` |
| Entrance motion | `{character}_{pace}_entrance` | `reveal_slow_entrance` · `lift_soft_entrance` |
| Token | named on its axis (next section) | — |

Generic primitives take **no** feature prefix (that is what makes them reusable — see
`14-primitive-layers-and-reuse.md`). Domain primitives take the feature prefix because their
data shape belongs to that feature.

---

## The Token-Axis Rule (the `cathedral` fix)

A token must be named on the **axis it measures.** There are three axes, and each is named
differently:

| Axis | What it measures | Naming style | Examples |
|---|---|---|---|
| **Emotional** | a feeling | emotional words (correct here) | `emotionalTone`: `plain_truth` · `warm_caution` · `soft_celebration` |
| **Character** | a kind/quality of movement or field | descriptive character words | `motion`: `breath` · `soft_lift` · `field_bloom`; background effects |
| **Scalar** | a magnitude on a hierarchy | an ordinal scale, **never** metaphor | `space_xs … space_2xl`; `typography_display … typography_caption` |

The rule in one line: **emotional names for emotional things, descriptive names for character
things, an ordinal scale for measurable things — never a metaphor that forces the AI to
translate across axes.**

That is why `cathedral` fails: spacing is a *scalar* axis (a size), but `cathedral` is a
metaphor from the *building* axis. The AI reliably knows `xs < 2xl`; it does **not** reliably
know `breath < cathedral`, and may read `cathedral` as *church*. Mood keeps its soul; spacing
gets a ruler.

---

## One Naming Spine

The same concept keeps the same root across every representation:

```
enum / type value (AI emits):   supporting → caption            (snake_case)
schema file:                    caption.ts                       (kebab-case)
renderer component:             CaptionNode                      (PascalCase + suffix)
```

```
enum:        scan_verdict_focus
schema file: scan-verdict-focus.ts
component:   ScanVerdictFocusScene
```

---

## Suffix Conventions

| Kind | Enum suffix | Component suffix |
|---|---|---|
| Generative surface | `_brioela_generative_ui` | n/a |
| Primitive | none | `Node` |
| Composition | none (the 3-part name already signals it) | `Scene` |
| Atmosphere | `_field` | `Field` |
| Entrance motion | `_entrance` | — |

Generative surface names deliberately carry the explicit `_brioela_generative_ui` suffix. This is
long on purpose: it prevents confusing an AI-selected enhancement surface with a full product
screen, a safety region, or a normal backend feature name. Use lowercase snake_case only.

---

## Banned Words (in any name, anywhere)

`card` · `button` · `panel` · `box` · `container` · `view` · `block` · `item` · `widget`

These drag the system back toward generic web UI. Use the grammar's own vocabulary instead
(scene, field, rail, thread, stamp, focus_window, headline, metric, meter, chip).

---

## Canonical Renames (supersede earlier files)

### Primitives — generic (no feature prefix)

| Old (in `02` / `03`) | New | Layer |
|---|---|---|
| `hero_line` | `headline` | Expressive |
| `whisper_note` | `caption` | Expressive |
| `metric_petal` | `metric_single` | Expressive |
| `reason_line` | `reason_statement` | Expressive |
| `additive_chip` | `chip` | Expressive |
| `nutrient_meter` | `meter` | Expressive |
| `swap_pair` | `swap_suggestion` | Expressive |
| `discovery_stamp` | `stamp` | Expressive |
| `memory_moment` (atom) | `timestamped_note` | Expressive |
| `question_line` · `source_caveat` · `confidence_note` | unchanged (already compliant) | Expressive |

### Primitives — domain (feature prefix kept)

| Old | New | Layer |
|---|---|---|
| `ingredient_thread` | `ingredient_list` | Domain |
| `mesa_grid` (atom part) | `mesa_member_row` | Domain |
| `recipe_step_rail` (atom part) | `recipe_step`, `recipe_timing` | Domain |
| `origin_mark` | unchanged | Domain |

Whimsical food-data visuals (`sugar_cube_line`, `fiber_broom_line`, `sodium_rain_line`) go
through the Domain-Primitive Rule in `14`: keep only those whose data shape a generic `meter`
+ tone cannot express; otherwise render them as a styled `meter`.

### Compositions

| Old | New |
|---|---|
| `single_focal_reveal` / `single_focal_verdict_scene` | `scan_verdict_focus` |
| `mesa_table` / `mesa_table_fit_overview_scene` | `mesa_fit_grid` |
| `food_memory_reverent_scene` | `memory_recall_reverent` |

New canonical examples in the same grammar: `scan_insight_secondary` · `scan_swap_comparison` ·
`mesa_conflict_spotlight` · `recipe_steps_rail` · `recipe_technique_spotlight` ·
`savings_story_scroll` · `summary_week_overview` · `share_discovery_stamp` ·
`kids_explainer_gentle`.

### Tokens

| Old | New |
|---|---|
| spacing `intimate` / `breath` / `cathedral` | `space_xs` · `space_sm` · `space_md` · `space_lg` · `space_xl` · `space_2xl` |
| voice `display` / `editorial` / `quiet` | `typography_display` · `typography_title` · `typography_body` · `typography_caption` |
| `mood` field name | `emotionalTone` |
| `atmosphere` field name | `backgroundEffect` |
| `composition` field name | `layoutTemplate` |
| `slots` field name | `content` |
| `beats` field name | `entranceMotion` |
| `voice` field name | `typographyStyle` |
| `tone` values | unchanged (semantic categories — unambiguous) |
| `motion` values | unchanged (character axis — describe the movement) |

---

## The Description Field Is The Fine Steering

A clean functional name removes *gross* mis-selection. The `description` on each catalog entry
removes the *fine* mis-selection. Every entry carries:

- **What it is** — one plain sentence.
- **When to use it** — the situation that should trigger this choice.
- **Emotional register** — the emotional tone it belongs to.
- **One gold example** — drives imitation (see `13-how-ai-selects.md`).

Name gets the model to the right neighborhood; description gets it to the right door. Neither
alone is enough.

---

## Anti-Patterns

- **Metaphor in an emitted enum** — `whisper_note`, `petal`, `cathedral`. Banned.
- **Scalar axis named by metaphor** — any size/hierarchy token that isn't an ordinal scale.
- **Inconsistent structure** — a name that doesn't follow its kind's positional grammar.
- **Web-widget words** — see banned list.
- **Domain prefix on a generic atom** — `recipe_headline` (see `14`).
- **Missing Brioela Generative UI suffix on a surface** — `scan_secondary` is ambiguous; use `scan_explanation_brioela_generative_ui`.

---

## What This File Depends On

- `11-composition-catalog-and-scale.md` — the vocabulary this law names.
- `14-primitive-layers-and-reuse.md` — generic vs domain decides whether a prefix applies.

## What Depends On This File

- `13-how-ai-selects.md` — names + descriptions are what the AI selects against.
- `19-code-package-structure.md` — file names follow the one-naming-spine rule.
