# Encore — Overview

## What This Folder Covers
Taste it once, cook it forever. The user photographs a dish they are eating (restaurant, friend's house, travel), optionally says what they taste, and Brioela reconstructs it into a cookable, constraint-adapted recipe with per-field confidence — then connects it to local sourcing (Ground), grocery delivery (Bela), and a Mira cooking session. The first cook refines the reconstruction through taste-check questions.

## Status
[x] guide complete — five files written, implementation not started

## Files In This Folder

| File | Contents |
|---|---|
| `01-capture-flow.md` | the capture moment: photo, optional voice note, automatic context, intent boundary vs. passive meal logging |
| `02-reconstruction-workflow.md` | the five-step Upstash Workflow: visual analysis → context fusion → reconstruction → adaptation → sourcing |
| `03-constraint-adaptation-and-sourcing.md` | constraint substitutions with attribution; Ground/map sourcing statuses; Bela handoff; ingredient_not_found events |
| `04-first-cook-refinement.md` | open questions injected into the Mira session, taste-check budget, post-cook refinement writes |
| `05-share-and-records.md` | the first-cook Discovery Card, data model, photo/audio discard rules |

## Specs This Folder Draws From
- `brioela-specs/44-encore.md` — the full feature spec
- `brioela-specs/02-recipe-ingestion-from-shared-content.md` — canonical recipe schema, estimated/confidence field conventions
- `brioela-specs/27-restaurant-menu-scanning.md` — menu text as the strongest reconstruction signal when present
- `brioela-specs/32-grandma-style-flavor-profile.md` — style-profile adaptation crossover
- `brioela-specs/35b-ground-finds-deep-design.md` — `ingredient_not_found` event kind and find-to-cooking trigger

## Key Decisions From Specs
- Capture asks zero questions. Photo required; voice note optional; context (location, same-visit menu scan, cuisine priors) automatic.
- Reconstruction is an async Upstash Workflow, never a streaming session. Draft target: under 30 seconds; capture acknowledgment under 1 second.
- Every uncertain field is marked `estimated` — the spec 02 nullable/confidence schema. The reconstruction never fabricates certainty.
- Output is a `user_recipe` with `source_type = 'encore'` plus recreation sidecar tables (open questions, refinements).
- Constraint substitutions are always annotated and attributed — never silent.
- First cook: Mira asks at most one or two taste-check questions tied to open questions, at natural moments only.
- Plate photos and voice audio are discarded after processing. Derived data only.
- Chef tier; capture always succeeds and stores — upgrading later unlocks already-captured reconstructions.
- Reconstructions are private. Never community data. Share card is explicit, city-level location at most.

## What This Folder Depends On
- `05-brain` — recipe storage, memory events, constraint profile reads
- `07-scanner` — GPT-4o mini vision extraction pipeline (shared extraction path)
- `17-menu-scanning` — same-visit menu context lookup
- `09-ground` — sourcing checks against location_signal_summary
- `11-bela` — order pre-fill handoff
- `08-cooking-session` — Mira session context injection for the first cook
- `19-recipe-ingestion` — canonical recipe schema and import-job patterns

## What Depends On This Folder
- `24-viral-sharing` — the recreation Discovery Card is a second-wave share moment
- `14-pantry-meal-plan` — recreated recipes enter the recipe pool like any saved recipe
