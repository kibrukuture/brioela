# Status

open

**Recipe ingestion not shipped.** Build-guide **19** is complete (docs only). Zero production import API, workflow, classifier, extraction, share extension, or ingestion tests. Partial dependencies: `recipes` table, `normalizedRecipeContentSchema`, `writeUserRecipe` (**08**) — no ingestion caller.

# Shipped in backend (partial — dependencies only)

- [x] `normalizedRecipeContentSchema` + `recipeOriginSchema` (**08** / **04**)
- [x] `recipes` + `recipe_versions` Drizzle schemas + migrations 0004–0006
- [x] `writeUserRecipe`, `readUserRecipe`, `readActiveUserRecipe` repositories
- [x] `view_user_recipe`, `update_user_recipe`, `archive_user_recipe` tools (**08** — post-import refinement)
- [ ] `backend/src/api/recipes/` module
- [ ] `POST /api/shared/import`, `POST /api/recipes/import`
- [ ] `GET /api/recipes/import/:jobId`, `GET /api/recipes/:id`
- [ ] Supabase `shared_import_jobs` + `recipe_source_artifacts`
- [ ] Upstash Workflow import pipeline
- [ ] Shared content classifier
- [ ] Source extraction (page, transcript, vision)
- [ ] Deep public web search pipeline step
- [ ] Normalization + confidence helpers
- [ ] Import constraint orchestration
- [ ] `memory_event` `recipe_imported` / `shared_content_routed`
- [ ] iOS/Android share extension
- [ ] Mobile import status UI
- [ ] Ingestion tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No share extension (iOS/Android) | `rg ShareExtension mobile` — zero Brioela targets |
| G2 | No `backend/src/api/recipes/` | `rg recipes/import backend` — zero |
| G3 | No `shared_import_jobs` Supabase schema | `rg shared_import backend shared/drizzle` — zero |
| G4 | No `recipe_source_artifacts` table | Same grep — zero |
| G5 | No Upstash Workflow for import | `build-guide/19-recipe-ingestion/02` specifies; no `recipe.import.workflow.ts` |
| G6 | No shared content classifier | `08-shared-content-classifier.md` — no `classify.shared.content` in repo |
| G7 | No route dispatcher to 26/28/33/24 | `route.shared.content` absent |
| G8 | No source extraction helpers | `03-source-extraction.md` — no fetch/transcript/vision import path |
| G9 | No deep web search pipeline step | `03` + **18** boundary — separate from `search_web` tool (also unshipped) |
| G10 | No normalization helper | No `normalize.recipe` / `generateObject` import path |
| G11 | No import confidence scoring | `05-confidence-and-constraints.md` thresholds not implemented |
| G12 | No constraint check on import | **07** tools unwired; **24** orchestration pattern not built |
| G13 | `writeUserRecipe` not called outside tests | `rg writeUserRecipe backend` — tests + repository only |
| G14 | No `memory_event` on import | `recipe_imported` kind documented in `01-memory-event.md` — no writer |
| G15 | No import status mobile UI | No `recipe-import` feature folder |
| G16 | No deduplication/idempotency | `02-import-job-workflow.md` — not implemented |
| G17 | No partial status product path | `partial` valid state in spec — no handler |
| G18 | Data model: dual job tables in overview vs single table | `00-overview.md` lists `shared_import_job` + `recipe_import_job` — **resolve to single `shared_import_jobs`** |
| G19 | `brioela-specs/02` stale vs build-guide | Uses `user_recipe` table name; no classifier; no `/api/shared/import` |
| G20 | No ingestion tests | No `recipe.import*.test.ts` |
| G21 | No Mira recipe review escalation wiring | `05` + **29**/**30** — trigger not built |
| G22 | No import completion push | **21** consumer — not wired |
| G23 | No shared validator schemas | No `recipe.import.schema.ts` in `shared/validator/` |
| G24 | Vision reuse from scanner not wired | **24** vision handlers unshipped — import cannot reuse yet |
| G25 | Meal plan eligibility metadata | `06-storage-and-library.md` ranking fields — not stored |
| G26 | Session log 020 "complete" misleading | Docs-only build-guide; no production code |

# 25 vs neighbor boundaries

| In **25** (this feature) | In separate feature |
|---|---|
| Share extension + import APIs | `recipes` schema + tools — **08** |
| Classifier at share intake | Menu dish parsing — **26** |
| Import workflow + job tables | Brain foundation — **04** |
| Deep web search in job | `search_web` tool — **18** |
| `writeUserRecipe(share_import)` | Session-end create tree — **29** |
| Constraint orchestration on import | Constraint matching — **07** |
| GPT-4o mini vision for share images | Scanner vision handlers — **24** |
| Import status UI + optional push | Notifications — **21** |
| Mira review escalation trigger | Mira session DO — **29** / **30** |

# Create-path overlap (resolved)

| Question | Answer |
|---|---|
| Who creates `share_import` rows? | **25** ingestion pipeline via `writeUserRecipe` |
| Who creates `cooking_session` rows? | **29** session-end decision tree + direct insert |
| Is there a create tool? | **No** — **08** explicitly omits `create_user_recipe` |
| Can import call `update_user_recipe`? | Agent/user after import via **08** tools only |

# Blocked by

- 01-platform-foundation (API router, Upstash, native targets)
- 04-brain-foundation (Brain DO — shipped)
- 08-brain-recipe-tools (schema + `writeUserRecipe` — partial shipped)
- 07-brain-constraint-tools (check logic — unwired)
- 24-scanner (vision pattern reuse — unshipped)

# Blocks

- 29-cooking-session (cook handoff from imported recipes — needs import rows)
- 34-pantry-meal-plan (imported recipe pool)
- 51-viral-sharing (share-sheet acquisition loop)
- 39-acoustic-cooking (`sound_cue` at reconstruction — import normalization may add later)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `brioela-specs/02-recipe-ingestion-from-shared-content.md` | `user_recipe` table; recipe-only flow — superseded by build-guide 19 classifier |
| `00-overview.md` two job table names | Prefer single `shared_import_jobs` (G18) |
| `_records/session-log/020-recipe-ingestion-complete.md` | "Complete" = build-guide docs, not backend |
| `002-recipes-active-status-mismatch.md` | Fixed — use `status` not `active` |
| No implementation ledger for ingestion | Unlike **08** `0005.recipe-tools.md` — build from build-guide only |

# Draft count

**21** files in `draft/` — 4 production snapshots (**08** boundary) + 16 gap/intended snapshots + `gap-index.md`.

# Sources

- `build-guide/19-recipe-ingestion/` (00–08)
- `brioela-specs/02-recipe-ingestion-from-shared-content.md`
- `brioela-specs/20-platform-and-app-distribution.md`
- `brioela-specs/25-viral-growth-and-sharing.md`
- `implementable-specs/09-recipes.md`
- `implementable-specs/01-memory-event.md`
- `_records/session-log/020-recipe-ingestion-complete.md`
- `_records/session-log/021-recipe-ingestion-shared-content-classifier-addendum.md`
- `_records/connections/15-recipe-ingestion-connections.md`
- `_records/build-order/17-layer-recipe-ingestion.md`
- `_features/08-brain-recipe-tools/status.md`
- `_features/18-brain-web-search/status.md`
- `_features/29-cooking-session/status.md`
