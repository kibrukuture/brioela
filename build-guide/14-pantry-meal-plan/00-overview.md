# Pantry and Meal Plan — Overview

## What This Folder Covers
Four interconnected features that form the "what should I eat this week" surface: fridge/pantry ingredient rescue (urgent — what can I make right now), predictive pantry intelligence (proactive — you'll run out of X in 3 days), the minimum spend meal plan (7-day plan from existing inventory + constraint-filtered recipes + waste minimization), and the weekly food summary (ambient digest of food behavior each week). All four share the same inventory model and constraint pipeline.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-pantry-snapshot.md` | fridge/pantry camera snapshot, detections, inventory estimate |
| `02-recipe-matching.md` | matching recipes to available ingredients and constraints |
| `03-meal-plan-generation.md` | 7-day plan generation, inventory/recipe/constraint context |
| `04-shopping-list-and-cost.md` | shopping list delta, estimated cost, store suggestions |
| `05-predictive-pantry.md` | purchase pattern prediction, depletion estimates, confidence tiers |
| `06-weekly-food-summary.md` | weekly rollup and delivery through notifications |

## Specs This Folder Draws From
- `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md` — camera ingredient detection, pantry snapshot, recipe ranking by ingredient coverage
- `brioela-specs/36-predictive-pantry-intelligence.md` — purchase interval estimation, predicted depletion date, confidence tiers, DO alarm cycle
- `brioela-specs/33-minimum-spend-meal-plan.md` — 7-day plan generation, inventory snapshot, waste minimization ranking, shopping list delta, voice access
- `brioela-specs/16-weekly-food-summary.md` — weekly rollup: scans, receipts, recipes, constraint matches; one-line summary + 2-4 observations

## Key Decisions From Specs
- Fridge rescue: operates on snapshots, not continuous live inventory
- Predictive pantry: median purchase interval from receipt history; high confidence (5+ events) = quiet notification + auto-add; low confidence = list only, no notification
- Meal plan: single LLM structured call, <5s, inventory snapshot from Orchestrator DO SQLite — no external query
- Waste minimization: produce bought 4 days ago ranks higher than pantry staples for meal plan inclusion
- Shopping list: delta between plan ingredients and estimated inventory; sorted by store department; estimated cost from price history
- Meal plan stored in Orchestrator DO (personal) not Supabase
- Weekly summary: DO alarm fires Sunday morning; delivered as push (medium priority, spec 23 rules apply)
- All four run on the DO alarm cycle — no separate scheduler needed

## What This Folder Depends On
- `05-orchestrator` — inventory state, purchase history, constraint profile all in Orchestrator DO SQLite
- `13-receipt-intelligence` — receipt history drives pantry state and price estimates
- `10-map` — shopping list store suggestions from community price data

## What Depends On This Folder
- `11-bela` — cooking intent trigger from meal plan → Bela order

## Boundary

This folder owns personal pantry/meal planning intelligence. Receipt Intelligence supplies purchase history. Map supplies store/price suggestions. Notifications only delivers surfaced moments.
