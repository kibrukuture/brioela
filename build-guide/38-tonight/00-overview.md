# Tonight — Overview

## What This Folder Covers
The zero-decision dinner answer. Once a day, at the user's learned dinner-decision time, one card with one dish — already possible with what is in the kitchen, matched to who is eating, the realistic time budget, and physiological readiness where wearables exist. Three responses: cook it (Mira session), swap (exactly two alternatives), not tonight (silent dismissal). When a weekly meal plan is active, Tonight is today's plan slot re-validated — never a competitor.

## Status
[x] guide complete — three files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-answer-generation.md` | the six-input selection (audience, inventory, time budget, state, pool, answer), the honesty fallbacks |
| `02-timing-and-delivery.md` | learned delivery time, push rules, the generative-grammar card |
| `03-learning-loop.md` | response signals, suppression ladder, the convergence rule with the meal plan |

## Specs This Folder Draws From
- `brioela-specs/51-tonight-dinner-answer.md` — the full feature spec
- `brioela-specs/33-minimum-spend-meal-plan.md` — shared inventory model, recipe pool order, constraint pipeline, convergence rule
- `brioela-specs/36-predictive-pantry-intelligence.md` — pantry estimates
- `brioela-specs/40-wearables-integration.md` — readiness modulation
- `brioela-specs/23-ambient-notification-strategy.md` — delivery limits and suppression
- `brioela-specs/41-mesa.md` — audience clearance

## Key Decisions From Specs
- One card, once a day, one dish + exactly two pre-computed swaps. Never a list to browse — browsing is the failure mode this feature kills.
- Constraint clearance (user + active Mesa audience) is the non-negotiable hard filter, same as the meal plan.
- Honesty fallbacks: a single-item pickup is permitted ("if you grab one can of chickpeas"); a shopping trip is not. No acceptable answer → no card. Silence over filler.
- Delivery time is learned (cooking session starts, recipe opens, fridge-scan moments), never configured. Cold start: sensible default window, in-app only, no push for two weeks.
- Push competes for the standard one-medium-per-day slot; quiet hours and active-session suppression unchanged.
- Dinner only (or the user's actual learned cooking meal); no breakfast/lunch expansion; no restaurant suggestions; zero configuration surfaces.
- Dismissals are silent; repeated card dismissal triggers the standard suppression ladder — the user who hates it stops getting it without finding a setting.
- All learning flows through `memory_event` — Tonight reads and writes the same spine as everything else.
- Core tier+; Cook-it opens a Mira voice session on Chef+, the standard recipe view on Core.

## What This Folder Depends On
- `14-pantry-meal-plan` — inventory model, recipe pool, constraint pipeline (shared, do not fork)
- `05-brain` / `06-brain-memory` — alarm scheduling, patterns, memory events
- `20-wearables` — readiness facts
- `26-mesa` — audience snapshots
- `12-notifications` — delivery rules
- `27-generative-grammar` — the card surface
- `08-cooking-session` — the Cook-it handoff

## What Depends On This Folder
Nothing — terminal surface. (Its outcome signals feed the shared learning spine others read.)
