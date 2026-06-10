# Negative Space Nutrition — Detection Pass

## What This File Covers

The weekly absence-detection pass.

## Source Specs

- `brioela-specs/50-negative-space-nutrition.md`

## Where It Runs

Inside the existing weekly Brain DO alarm cycle, alongside behavior pattern detection. No new scheduler.

## The Six Steps

1. **Coverage check** — abort silently below the floor (file 01).
2. **Presence map** — classify the window's observed items (scans-with-purchase, receipt items, cooked recipes, logged meals) against tracked categories using corpus nutrient data → category → carrier count + recency.
3. **Structural absences** — categories at near-zero across the full window (6-week minimum).
4. **Displacement gaps** — diff against the `diet.*` memory timeline and drift patterns: removed category's nutrient load vs. what replaced it. (The one step that may use a structured LLM call; everything else is counting queries.)
5. **Confidence + dedup** — drop previously answered gaps, below-threshold evidence, anything contradicted by memory (e.g., "takes fish oil").
6. **Queue** — at most one candidate enters the shared intervention queue (spec 17 budget).

## Tracked Categories (v1)

omega-3 sources, calcium carriers, fiber density, fresh produce/vitamin C, iron sources, protein variety. Short on purpose — food-pattern-visible, well-evidenced. Expansion is a deliberate decision, not drift.

## Condition Handoff

Candidates touching an active medical condition's watchlist are suppressed here entirely. Potassium with kidney disease is spec 28's territory, never this feature's.

## Data

`nutrient_presence_window` + `nutrition_gap` rows in the Brain DO. Closures mirrored to `user_memory` `diet.gaps` via `memory_update` so all downstream surfaces see them through normal memory injection.

## Rule

Bounded compute: counting queries + at most one LLM call per pass.
