# Session 021 — Recipe Ingestion Shared Content Router Addendum

## Date

2026-06-06

## Completed This Session

Deep read pass before writing:
- `build-guide/00-rules.md`
- `_records/session-log/020-recipe-ingestion-complete.md`
- `build-guide/19-recipe-ingestion/00-overview.md`
- `build-guide/19-recipe-ingestion/01-share-sheet-entry.md`
- `build-guide/19-recipe-ingestion/02-import-job-workflow.md`
- `build-guide/19-recipe-ingestion/04-recipe-normalization.md`
- `build-guide/19-recipe-ingestion/05-confidence-and-constraints.md`
- `build-guide/19-recipe-ingestion/06-storage-and-library.md`
- dependency docs: Cooking Session overview, Menu Scanning overview

Written/updated — `build-guide/19-recipe-ingestion/`:
- `00-overview.md` — changed share-sheet framing from recipe-only to general shared food-content intake
- `01-share-sheet-entry.md` — updated accepted inputs, endpoint framing, and confirmation copy
- `02-import-job-workflow.md` — added classification/routing step before extraction/normalization
- `03-source-extraction.md` — added broader source classification and deep web search for incomplete recipe evidence
- `04-recipe-normalization.md` — added multi-source reconstruction rules without fabrication
- `05-confidence-and-constraints.md` — added hard-conflict UI behavior and live agent review surface
- `06-storage-and-library.md` — clarified non-recipe shares route to destination surfaces instead of recipe library
- `08-shared-content-router.md` — new routing spec for recipe/menu/place/product/receipt/food-note shares

Updated records:
- `_records/connections/15-recipe-ingestion-connections.md`
- `_records/build-order/17-layer-recipe-ingestion.md`
- `_records/session-log/021-recipe-ingestion-shared-content-router-addendum.md`

## Product Direction Captured

- Share sheet does not assume every share is a recipe.
- Brioela first classifies shared content, then routes it.
- Recipe-like content can use deeper public web search when initial evidence is incomplete.
- If confidence remains low, source is saved as partial instead of fabricating a recipe.
- Hard allergy/diet conflicts appear in UI before cooking and can escalate to a live assistant conversation.
- The realtime voice/video assistant stack is a common Brioela capability for places where intelligence and conversation are needed, not only cooking.
- Non-recipe shares can still write useful private memory or route to menu scanning, map/place, product scan, or receipt intelligence.

## In Progress

Nothing half-done.

## What Is Next

Next not-started feature by build order: `20-wearables`.

Before writing, read:
- `build-guide/00-rules.md`
- latest session log
- `build-guide/20-wearables/00-overview.md`
- `brioela-specs/40-wearables-integration.md`
- dependencies: Ambient Intelligence, Notifications, Brain, Memory Engine

## Blockers / Decisions

- Shared content routing is private by default.
- Only feature-specific privacy rules allow shared/public writes.
- Recipe reconstruction must stay evidence-based even when using deep web search.
