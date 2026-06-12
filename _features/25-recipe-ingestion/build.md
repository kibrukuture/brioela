# Recipe Ingestion — Build

Feature **25**. Production paths under `backend/src/api/recipes/` (handlers, helpers, workflow), `shared/drizzle/schema/` (import job + artifact tables), `shared/validator/` (import Zod schemas), `shared/routes/` (route constants), `mobile/features/share-extension/` and `mobile/features/recipe-import/` (extension + status UI), plus Brain internal route for `writeUserRecipe` from Worker.

**Scope:** Share extension, shared import API, classifier, Upstash Workflow pipeline, extraction, deep web search step, normalization, constraint orchestration, Brain recipe write, memory events, status polling, mobile import UX. **Not in 25 build:** recipe tools (**08**), `search_web` (**18**), session-end create (**29**), menu parser (**26**), map place resolver (**28**), receipt parser (**33**), product scan (**24**).

---

## Shipped today

| Area | Status |
|---|---|
| `normalizedRecipeContentSchema` + `recipeOriginSchema` | ✓ (**08** / **04**) |
| `recipes` table + migrations 0004–0006 | ✓ (**08**) |
| `writeUserRecipe` / `readUserRecipe` repositories | ✓ (**08** — no ingestion caller) |
| `view_user_recipe` / `update_user_recipe` / `archive_user_recipe` | ✓ (**08** — post-import) |
| `backend/src/api/recipes/` | ✗ |
| Share extension (iOS/Android) | ✗ |
| Import job Supabase tables | ✗ |
| Upstash Workflow import job | ✗ |
| Classifier + extraction + normalizer | ✗ |
| Deep web search pipeline step | ✗ |
| Import constraint check | ✗ |
| `memory_event` on import | ✗ |
| Mobile import status UI | ✗ |
| Tests | ✗ |

---

## File manifest

### Shared validator (25)

| File | Role |
|---|---|
| `shared/validator/recipe.import.schema.ts` | `RecipeShareInputSchema`, `CreateSharedImportRequestSchema`, `RecipeImportStatusSchema`, `SharedContentClassificationSchema`, `RecipeSourceArtifactsSchema` |
| `shared/routes/recipe.routes.ts` | `RECIPE_ROUTES`, `SHARED_IMPORT`, `RECIPES_IMPORT`, `IMPORT_STATUS`, `GET_RECIPE` |

### Supabase Drizzle (25)

| File | Role |
|---|---|
| `shared/drizzle/schema/shared.import.job.schema.ts` | `shared_import_jobs` — user, source fields, route, status, failure_reason, recipe_id, dedupe_key |
| `shared/drizzle/schema/recipe.source.artifact.schema.ts` | `recipe_source_artifacts` — transcript, captions, extracted text, thumbnail |
| `shared/drizzle/migrations/*` | Postgres migrations for above |

**Note:** Overview doc listed `recipe_import_job` as second table — **ship single `shared_import_jobs`** with `route` + `recipe_id` nullable (G18 resolution).

### Backend API — recipes module (25)

| File | Role |
|---|---|
| `backend/src/api/recipes/recipes.route.ts` | Hono mount |
| `backend/src/api/recipes/recipes.controller.ts` | Controller wiring |
| `backend/src/api/recipes/_handlers/create.shared.import.handler.ts` | `POST /api/shared/import` |
| `backend/src/api/recipes/_handlers/create.recipe.import.handler.ts` | `POST /api/recipes/import` (recipe-fast-path) |
| `backend/src/api/recipes/_handlers/get.import.status.handler.ts` | `GET /api/recipes/import/:jobId` |
| `backend/src/api/recipes/_handlers/get.recipe.handler.ts` | `GET /api/recipes/:id` (Brain read) |
| `backend/src/api/recipes/_handlers/index.ts` | Barrel |
| `backend/src/api/recipes/_helpers/classify.shared.content.helper.ts` | `SharedContentClassification` |
| `backend/src/api/recipes/_helpers/route.shared.content.helper.ts` | Dispatch to 26/28/33/24/memory |
| `backend/src/api/recipes/_helpers/extract.source.artifacts.helper.ts` | Page, video metadata, vision |
| `backend/src/api/recipes/_helpers/deep.web.search.recipe.helper.ts` | Corroborating public search — **not** search_web tool |
| `backend/src/api/recipes/_helpers/normalize.recipe.helper.ts` | LLM → `normalizedRecipeContentSchema` |
| `backend/src/api/recipes/_helpers/compute.recipe.confidence.helper.ts` | Breakdown + overall score |
| `backend/src/api/recipes/_helpers/check.import.constraints.helper.ts` | Brain RPC constraint check |
| `backend/src/api/recipes/_helpers/write.imported.recipe.helper.ts` | Brain RPC `writeUserRecipe` |
| `backend/src/api/recipes/_helpers/log.recipe.imported.helper.ts` | `memory_event` kind `recipe_imported` |
| `backend/src/api/recipes/_helpers/dedupe.import.job.helper.ts` | URL hash + window idempotency |
| `backend/src/api/recipes/_helpers/enhance.image.helper.ts` | Reuse from **24** vision path |
| `backend/src/api/recipes/_helpers/index.ts` | Barrel |
| `backend/src/api/recipes/jobs/recipe.import.workflow.ts` | Upstash Workflow 10-step pipeline |
| `backend/src/api/recipes/jobs/recipe.import.job.orchestrator.ts` | QStash/Workflow entry |
| `backend/src/api/recipes/index.ts` | Module export |

Register routes in backend app router (**01**).

### Brain DO — internal write path (25 wires; 08 owns schema)

| File | Role |
|---|---|
| Brain fetch `POST /internal/write-imported-recipe` | Validates JSON + calls `writeUserRecipe` |
| Brain fetch `POST /internal/log-recipe-imported` | `writeMemoryEvent` kind `recipe_imported` |

Constraint check: reuse pattern from **24** `POST /internal/check-constraints` (**07** body).

### Mobile (25)

| File | Role |
|---|---|
| `mobile/ios/ShareExtension/` | iOS share extension target |
| `mobile/android/app/src/main/java/**/ShareReceiverActivity.kt` | Android `ACTION_SEND` handler |
| `mobile/features/share-extension/share-extension.api.ts` | `POST /api/shared/import` |
| `mobile/features/recipe-import/components/import-status-tray.tsx` | In-app status surface |
| `mobile/features/recipe-import/components/import-pending-list.tsx` | Partial / pending section |
| `mobile/features/recipe-import/hooks/use.import.status.hook.ts` | Poll `GET /api/recipes/import/:jobId` |
| `mobile/network/recipes/get-recipe.api.ts` | `GET /api/recipes/:id` |

PWA: manual URL paste optional — not primary loop (`01-share-sheet-entry.md`).

### Background / workflow (25)

| Job | Role |
|---|---|
| `recipe.import.workflow.ts` | Upstash Workflow — classify → extract → search → normalize → store |
| QStash trigger from `create.shared.import.handler` | Fire-and-forget after job row |

Reference pattern: `backend/src/api/medications/jobs/` orchestrator (switch on job type).

---

## Workflow step contract

Idempotent by `jobId`. Steps map to status transitions in `02-import-job-workflow.md`:

1. `fetchSourceMetadata` → update job metadata fields
2. `classifySharedContent` → `classifying`
3. `routeNonRecipe` (if not recipe) → `routing` → complete without recipe row
4. `extractSourceArtifacts` → `extracting`
5. `deepWebSearchRecipeEvidence` (conditional) → still `extracting`
6. `normalizeRecipe` → `normalizing`
7. `computeConfidence` + threshold gate
8. `checkImportConstraints` → Brain RPC
9. `storeRecipeOrPartial` → `writeUserRecipe` or artifact-only partial
10. `finalizeJob` → `completed` | `needs_review` | `partial` | `failed` + optional push

---

## Acceptance criteria

### Share extension

- [ ] iOS share extension registers for URLs and images; responds within 2s with confirmation copy from spec
- [ ] Android handles `ACTION_SEND` / `ACTION_SEND_MULTIPLE` with same API contract
- [ ] Extension does not run model calls or large uploads beyond safe platform limits
- [ ] Unauthenticated share preserves pending payload for sign-in handoff (or blocks with clear copy — pick one and document)

### API

- [ ] `POST /api/shared/import` returns `{ jobId, status: 'queued' }` immediately
- [ ] `GET /api/recipes/import/:jobId` returns status, route, `recipeId`, warnings, `failureReason`
- [ ] Duplicate share within dedupe window returns existing job id
- [ ] `GET /api/recipes/:id` returns parsed recipe for owner (Brain read)

### Classifier

- [ ] TikTok recipe video → `recipe_import` route
- [ ] Restaurant menu URL → `menu_scan` route (delegates to **26** stub until built)
- [ ] Maps restaurant link → `map_place`
- [ ] Receipt image → `receipt_import`
- [ ] Non-food → `reject` without silent drop

### Extraction

- [ ] HTTP(S) fetch with timeout and size limits
- [ ] JSON-LD recipe markup extracted when present
- [ ] Vision path uses GPT-4o mini + contrast enhancement (**24** pattern)
- [ ] Artifacts persisted to `recipe_source_artifacts`

### Deep web search

- [ ] Runs only when recipe-like + incomplete artifacts
- [ ] Does not call Brain `search_web` tool executable
- [ ] Attribution preserved for all corroborating URLs
- [ ] Weak evidence → `partial` not fabricated recipe

### Normalization + storage

- [ ] Output validates against `normalizedRecipeContentSchema`
- [ ] `recipes.origin = share_import`, `link_url` set, `title` synced to `content.title`
- [ ] Below cookable minimum → `partial` status, no full recipe row
- [ ] `memory_event` kind `recipe_imported` on successful save

### Constraints

- [ ] Hard allergy on import → recipe saved, UI shows blocked/caution, no default cook CTA
- [ ] Uses same ingredient-name cross-check as scanner (**07**)

### UX

- [ ] User-visible states: processing, completed, needs review, partial
- [ ] Partial imports in pending area, not mixed with cookable library
- [ ] Push on complete only when **21** rules allow

### Tests

- [ ] Handler tests: create import, status poll, dedupe
- [ ] Classifier fixture tests per `primaryKind`
- [ ] Normalizer schema validation test with fixture artifacts
- [ ] Workflow idempotency test (retry step does not duplicate recipe)

---

## Cross-feature build order

1. **04** + **08** schemas/repos (shipped)
2. **25** Supabase job tables + shared validators
3. **25** API handlers + workflow skeleton
4. **25** classifier + extraction + normalizer
5. **25** Brain internal write + memory_event
6. **07** constraint RPC (or **24** orchestration pattern)
7. **25** mobile share extension + status UI
8. **21** optional completion push
9. **26** / **28** / **33** / **24** route targets (stubs OK initially)

---

## Sources

- `build-guide/19-recipe-ingestion/` (all 9 files)
- `brioela-specs/02-recipe-ingestion-from-shared-content.md`
- `brioela-specs/20-platform-and-app-distribution.md`
- `implementable-specs/09-recipes.md`
- `implementable-specs/01-memory-event.md`
- `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md`
- `_features/08-brain-recipe-tools/build.md`
- `_features/18-brain-web-search/spec.md` (boundary)
- `_features/24-scanner/build.md` (vision + constraint orchestration pattern)
