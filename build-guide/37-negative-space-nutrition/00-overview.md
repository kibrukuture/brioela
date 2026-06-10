# Negative Space Nutrition — Overview

## What This Folder Covers
Detecting what is consistently missing from the user's food life: nutrient categories with near-zero presence across the observation window (structural absence), and nutrients lost when a dietary change removed their carrier without replacement (displacement gap). Surfaced conversationally, rarely, with evidence, under the spec 17 intervention budget. The coverage gate keeps the feature honest: it claims only what was observed, and stays silent when the observed stream is too thin to support a claim.

## Status
[x] guide complete — three files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-coverage-gate.md` | the coverage score, the floor, the observation honesty rules |
| `02-detection-pass.md` | the six-step weekly pass, tracked categories, condition handoff suppression |
| `03-surfacing-and-memory.md` | conversational delivery, one-question-one-answer closure, standing concerns through existing surfaces |

## Specs This Folder Draws From
- `brioela-specs/50-negative-space-nutrition.md` — the full feature spec
- `brioela-specs/17-behavioral-food-pattern-detection.md` — shared intervention budget and delivery model
- `brioela-specs/28-medical-condition-food-profile.md` — condition-sensitive suppression boundary
- `brioela-specs/16-weekly-food-summary.md` — progress surface for confirmed concerns

## Key Decisions From Specs
- Coverage gate first, always: detection runs only when the user's food life is substantially visible (receipt cadence, meal-log density, scan frequency). Below the floor: silence. No insight is better than a wrong one.
- Observation framing is mandatory: "almost nothing with omega-3 has come through your kitchen" — never "you are deficient." The app never diagnoses (spec 30 boundary).
- v1 tracked categories are deliberately short and food-pattern-visible: omega-3, calcium carriers, fiber density, fresh produce/vitamin C, iron sources, protein variety.
- Condition handoff: gap candidates touching an active condition's watchlist (e.g., potassium with kidney disease) are suppressed here entirely — spec 28 owns that territory.
- One question per gap, one answer, permanent memory (`diet.gaps` namespace). Closed gaps never resurface.
- Shared weekly budget with spec 17 — never a pattern insight and a gap insight in the same week. No new screen exists; concerns flow through plan, verdict notes, weekly summary.
- Cold start: structurally silent for the first 6 weeks of qualifying coverage. Not a bug.
- Core tier+, same placement as behavioral patterns.

## What This Folder Depends On
- `05-brain` / `06-brain-memory` — event log, memory writes, the weekly alarm cycle
- `18-ambient-intelligence` — the shared intervention queue and budget
- `07-scanner` — product corpus nutrient data for presence classification
- `13-receipt-intelligence` — receipt stream (the coverage backbone)
- `14-pantry-meal-plan` — standing concerns shape plan composition

## What Depends On This Folder
- `14-pantry-meal-plan` — gap-filling recipe selection for confirmed concerns
- `36-year-in-food` — none (gap data is not chapter material; resolved-gap milestones may surface via spec 38 only as user-visible dietary changes)
