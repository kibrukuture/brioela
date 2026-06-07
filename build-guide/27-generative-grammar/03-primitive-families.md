# Brioela Generative Grammar — Primitive Families

## What This File Covers

The primitive inventory, organized by the three layers defined in
`14-primitive-layers-and-reuse.md` (structural, expressive, domain) and named under
`12-naming-law.md`. This file lists *what atoms exist*; `14` explains *how they are reused
across features*, and `11` explains how they roll up into compositions.

This file was migrated from the original metaphor names (`hero_line`, `metric_petal`,
`whisper_note`…) to the functional naming law. The old → new mapping is preserved at the bottom
so nothing is lost.

---

## Design Principle

Primitives are letters, not pages. A small set of expressive atoms combines into many emotional
moments while preserving Brioela's visual language. Taste does not live in the atom's name — it
lives in how the atom is rendered and arranged (see `14`).

---

## Layer 1 — Structural Primitives

Pure layout and surface. No meaning, no domain. Every feature uses these unchanged.

Layout:

- `stack`
- `cluster`
- `split`
- `rail`
- `ribbon`
- `constellation`
- `focus_window`

Surface / field hosts:

- `ambient_surface`
- `glass_surface`
- `verdict_field`
- `quiet_sheet`
- `story_surface`
- `shared_artifact`

---

## Layer 2 — Expressive Primitives

Generic meaning atoms. Reused by every feature (scan, shopper, Bela, Mesa, cooking, memory).
None are tied to a single feature.

Text / meaning:

- `headline`
- `caption`
- `reason_statement`
- `question_line`
- `micro_explainer`
- `source_caveat`
- `confidence_note`

Data / mark:

- `metric_single`
- `meter`
- `chip`
- `thread`
- `stamp`
- `timestamped_note`

---

## Layer 3 — Domain Primitives

Feature-specific data shapes that generic atoms cannot carry. Each earns its place via the
Domain-Primitive Rule in `14`. Grouped by feature.

Food:

- `ingredient_list`
- `origin_mark`
- candidate food-data visuals — `sugar_cube_line`, `fiber_broom_line`, `sodium_rain_line`:
  keep **only** if a generic `meter` + tone genuinely cannot express them; otherwise render as a
  styled `meter` (see `14` Domain-Primitive Rule).

Mesa:

- `mesa_member_row`  *(the per-member atom; the grid is the `mesa_fit_grid` composition, and a
  member label is a generic `chip`, a "works for all" mark is a generic `stamp`)*

Recipe / cooking:

- `recipe_step`
- `recipe_timing`
- `recipe_phase_marker`  *(technique framing is a generic `micro_explainer`; a substitution is a
  generic `swap_suggestion`; a "grandma" framing is a generic `caption` in a warm tone)*

Share / discovery:

- `attribution_mark`  *(a share headline is a generic `headline`; a privacy-safe summary is a
  generic `micro_explainer`; creator credit is an `attribution_mark`)*

---

## Old → New Mapping (nothing dropped)

| Old name | New | Layer / note |
|---|---|---|
| `glass_panel` | `glass_surface` | Structural (`panel` is a banned word) |
| `story_card` | `story_surface` | Structural (`card` is a banned word) |
| `hero_line` | `headline` | Expressive |
| `whisper_note` | `caption` | Expressive |
| `reason_line` | `reason_statement` | Expressive |
| `metric_petal` | `metric_single` | Expressive |
| `nutrient_meter` | `meter` | Expressive |
| `additive_chip` | `chip` | Expressive |
| `ingredient_thread` | `ingredient_list` | Domain (food) |
| `mesa_grid` | `mesa_member_row` + `mesa_fit_grid` (composition) | Domain + composition |
| `member_chip` | `chip` | Expressive (with mesa tone) |
| `works_for_all_stamp` | `stamp` | Expressive (with mesa tone) |
| `avoid_for_member_line` | `caption` / `reason_statement` | Expressive |
| `table_fit_summary` | `mesa_fit_grid` (composition) | Composition |
| `recipe_step_rail` | `recipe_step` + `recipe_steps_rail` (composition) | Domain + composition |
| `timing_bead` | `recipe_timing` | Domain |
| `technique_note` | `micro_explainer` | Expressive |
| `substitution_pair` | `swap_suggestion` | Expressive |
| `grandma_note` | `caption` (warm tone) | Expressive |
| `cook_phase_marker` | `recipe_phase_marker` | Domain |
| `memory_moment` | `timestamped_note` | Expressive |
| `first_time_badge` | `stamp` | Expressive |
| `long_gap_note` | `timestamped_note` | Expressive |
| `on_this_day_line` | `timestamped_note` | Expressive |
| `staple_count` | `metric_single` | Expressive |
| `discovery_stamp` | `stamp` | Expressive |
| `share_headline` | `headline` | Expressive |
| `privacy_safe_summary` | `micro_explainer` | Expressive |
| `creator_credit` | `attribution_mark` | Domain (share) |
| `swap_pair` | `swap_suggestion` | Expressive |

Unchanged (already compliant): `stack`, `cluster`, `split`, `rail`, `ribbon`, `constellation`,
`focus_window`, `ambient_surface`, `verdict_field`, `quiet_sheet`, `shared_artifact`,
`question_line`, `micro_explainer`, `source_caveat`, `confidence_note`, `origin_mark`.

---

## Primitive Count (corrected)

The original "40–60 primitives" undercounted by treating all primitives as one bucket. Corrected
targets, per `11` and `14`:

- Structural: ~15–25
- Expressive (generic): ~25–40
- Domain: ~15–25, growing per feature

So ~40 generic atoms every feature reuses + ~20 domain atoms that grow over time. Compositions
(the scenes) are a separate, larger and ever-growing layer — see
`11-composition-catalog-and-scale.md`.

---

## What This File Depends On

- `12-naming-law.md` — the naming law these names follow.
- `14-primitive-layers-and-reuse.md` — the three layers and the reuse model.

## What Depends On This File

- `02-grammar-document.md` — the node union that types these atoms.
- `11-composition-catalog-and-scale.md` — how atoms roll up into compositions.
