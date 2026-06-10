# Tonight — Answer Generation

## What This File Covers

How the single answer is selected.

## Source Specs

- `brioela-specs/51-tonight-dinner-answer.md`
- `brioela-specs/33-minimum-spend-meal-plan.md`

## The Six Inputs (in order)

1. **audience** — active Mesa audience for tonight if known, else the user. Full constraint clearance, hard filter, non-negotiable.
2. **inventory** — pantry estimate (meal-plan inventory model): fully-covered dishes preferred; expiring items rank first.
3. **time budget** — tonight's realistic window from observed patterns (weekday vs weekend session starts) + calendar tightness signal where granted.
4. **state** — readiness/sleep from `health.biometrics` when present: low readiness → simple + nourishing; high-activity day → substantial.
5. **pool** — made-and-liked > saved > new-but-near (the meal-plan order); variety guard against the last 3 days of cooked history.
6. **answer** — one dish + exactly two pre-computed swaps (same at-home ingredients where possible).

## Honesty Fallbacks

- Inventory can't cover anything acceptable → one answer with one pickup: "pasta e ceci — if you grab one can of chickpeas on the way home." One item max; a shopping trip is the meal plan's job.
- Nothing clears the bar (empty kitchen, no history, thin coverage) → **no card**. Silence over filler.

## Convergence Rule (strict)

Active meal plan → Tonight IS today's plan slot, re-validated against current inventory and readiness. Re-validation failure (ingredient gone) → adjusted answer served AND the plan slot updated. Tonight never contradicts the plan with a competing suggestion.

## Mechanics

Generation runs in the Brain DO ahead of delivery time (alarm-scheduled). At most one structured LLM call over locally assembled context. Card open is instant from the stored answer.

## Rule

Mesa audience inference is conservative: explicitly active audience or recurring-pattern memory only. Never guessed from thin air.
