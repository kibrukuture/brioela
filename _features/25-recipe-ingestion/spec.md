# Recipe Ingestion — Spec

Feature **25**. Share-sheet and URL intake for food-related content: classify what was shared, extract source evidence, optionally run deep public web search for missing recipe detail, normalize to `NormalizedRecipeContent`, check user constraints, write `share_import` rows to Brain SQLite `recipes`, log `memory_event`, and route non-recipe shares to the correct Brioela surface.

**Not in this feature:** Recipe view/update/archive tools (**08**); live chat `search_web` (**18**); cooking-session-end recipe reconstruction (**29**); menu dish parsing body (**26**); map place resolution (**28**); receipt line-item parsing (**33**); product scan verdict (**24**); Mira cooking room runtime (**29** / **30**); viral share cards (**51**).

---

## Purpose

Someone watches food content on TikTok, YouTube, Instagram, or the web → taps Share → Brioela. Within 2 seconds the extension confirms capture. Backend classifies the share (recipe vs menu vs place vs product vs receipt vs food note), runs a durable async job, and either produces a private cookable recipe or routes to the right feature without treating every share as a recipe.

Imported recipes land in the same `recipes` table as session-captured recipes (**08** / **29**) with `origin = share_import`. There is **no `create_user_recipe` tool** — ingestion calls `writeUserRecipe` (repository) or Brain internal RPC after normalization.

---

## What it is (and is not)

| Aspect | Contract |
|---|---|
| Entry | Native iOS/Android share extension; optional `POST /api/recipes/import` when caller already knows route |
| First step | **Classification** — `08-shared-content-classifier.md` |
| Async engine | Upstash Workflow (multi-step, idempotent by `jobId`) — **not** inline in extension |
| Recipe body | `NormalizedRecipeContent` validated by `normalizedRecipeContentSchema` (**08**) |
| Deep web search | Pipeline step when artifacts incomplete — **not** Brain `search_web` tool (**18**) |
| Storage | Brain DO SQLite `recipes` + optional Supabase job/artifact tables |
| Privacy | All imports private; no community publishing |

---

## Complete pipeline inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/19-recipe-ingestion/`, `brioela-specs/02-recipe-ingestion-from-shared-content.md`, `backend/src/api/`, `mobile/`, neighbor `_features/08`, `18`, `26`, `29`.

| Component | Type | In **25**? | Shipped? | Owner / trigger | Primary sources |
|---|---|:---:|:---:|---|---|
| **iOS/Android share extension** | Native target | **Yes** | No | User Share → Brioela | `01-share-sheet-entry.md` |
| **`POST /api/shared/import`** | Hono handler | **Yes** | No | Extension + classifier entry | `01`, `02` |
| **`POST /api/recipes/import`** | Hono handler | **Yes** | No | Recipe-known fast path | `02` |
| **`GET /api/recipes/import/:jobId`** | Hono handler | **Yes** | No | Status polling | `02` |
| **`GET /api/recipes/:id`** | Hono handler | **Yes** | No | Completed recipe read | `02`, `06` |
| **`shared_import_job` table** | Supabase Postgres | **Yes** | No | Job row at share intake | `00-overview`, `02` |
| **`recipe_source_artifact` table** | Supabase Postgres | **Yes** | No | Extraction evidence retention | `03`, `06` |
| **Upstash Workflow** | Durable job | **Yes** | No | 10-step import pipeline | `02-import-job-workflow.md` |
| **Shared content classifier** | Backend helper | **Yes** | No | Step 2–3 of workflow | `08-shared-content-classifier.md` |
| **Route dispatcher** | Backend helper | **Yes** | No | Non-recipe routes | `08` |
| **Source fetch + JSON-LD** | Backend helper | **Yes** | No | HTTP(S) page extraction | `03-source-extraction.md` |
| **Video transcript/caption fetch** | Backend helper | **Yes** | No | TikTok/YouTube/IG metadata | `03` |
| **GPT-4o mini vision extraction** | Backend + AI | **Yes** | No | Screenshots/images — reuses **24** pattern | `03`, `07-scanner/05` |
| **Deep public web search** | Pipeline step | **Yes** | No | Corroborate incomplete recipe evidence | `03` — **not** **18** |
| **Recipe normalizer** | LLM + Zod | **Yes** | No | `generateObject` → `normalizedRecipeContentSchema` | `04-recipe-normalization.md` |
| **Confidence scoring** | Backend helper | **Yes** | No | UI thresholds + `needs_review` | `05-confidence-and-constraints.md` |
| **Constraint check on import** | Backend → Brain | **Yes** orchestration | No | Same ingredient cross-check as **07** / **24** | `05` |
| **`writeUserRecipe` insert** | Brain repository | **08** repo, **25** caller | Partial | `origin=share_import`, `link_url` | `06-storage-and-library.md` |
| **`memory_event` `recipe_imported`** | Brain write | **Yes** | No | Fire-and-forget on success | `06`, `01-memory-event.md` |
| **`shared_content_routed` event** | Brain write | **Yes** | No | Non-recipe routes | `08` |
| **Import status UI** | Mobile | **Yes** | No | Tray, pending section, completion | `07-import-status-and-growth-loop.md` |
| **Push on import complete** | **21** | Consumer | No | Low priority when user inactive | `07` |
| **Mira recipe review session** | **29** / **30** | Escalation only | No | Hard allergy / high uncertainty | `05` |
| **`normalizedRecipeContentSchema`** | Zod (**08**) | Boundary | **Yes** | Shared canonical shape | `normalized.recipe.content.schema.ts` |
| **`recipes` table + `writeUserRecipe`** | Brain SQLite (**08**) | Boundary | **Yes** | Target write surface | `recipe.schema.ts` |
| **`view_user_recipe` / update / archive** | Brain tools (**08**) | Post-import | **Yes** tools | Agent refines after import | **08** |
| **Menu scan pipeline** | **26** | Routed target | No | When `recommendedRoute = menu_scan` | `08` |
| **Map / place memory** | **28** | Routed target | No | `map_place` route | `08` |
| **Receipt intelligence** | **33** | Routed target | No | `receipt_import` route | `08` |
| **Product scan** | **24** | Routed target | No | `product_scan` route | `08` |
| **Session-end recipe create** | **29** | Separate create path | No | `origin=cooking_session` — not share | `09-recipes.md` |
| **`search_web` tool** | **18** | **No** | No | Live chat only — not ingestion | `18-brain-web-search/spec.md` |

### Shipped in repo today (ingestion-related)

- `normalizedRecipeContentSchema`, `recipeOriginSchema`, `recipes` Drizzle schema, migrations **0004–0006** (**04** / **08**).
- `writeUserRecipe`, `readUserRecipe`, `readActiveUserRecipe` repositories — **tests only** for create path; no ingestion caller.
- Recipe tools `view_user_recipe`, `update_user_recipe`, `archive_user_recipe` (**08**) — post-import refinement.
- **No** `backend/src/api/recipes/`, **no** share extension, **no** import job tables, **no** workflow, **no** classifier, **no** extraction helpers, **no** ingestion tests.

---

## Architecture — share to library

```text
User Share (TikTok / YouTube / IG / browser / image)
        │
        ▼
Native share extension (≤2s confirm, no model calls)
        │
        ▼
POST /api/shared/import                          ← 25
        │
        ├── write shared_import_job (queued)
        └── trigger Upstash Workflow (jobId)
                │
                ├─ 1. fetch source metadata
                ├─ 2. classify (SharedContentClassification)
                ├─ 3. route non-recipes → 26 / 28 / 33 / 24 / memory_event
                ├─ 4. extract artifacts (page, transcript, vision)
                ├─ 5. deep public web search (if incomplete)     ≠ search_web (18)
                ├─ 6. normalize → NormalizedRecipeContent
                ├─ 7. confidence thresholds
                ├─ 8. constraint check (Brain RPC)
                ├─ 9. writeUserRecipe (share_import) + artifacts
                └─ 10. memory_event + notify / in-app surface
        │
        ▼
Recipe library (Brain recipes) + optional Mira review (29/30)
        │
        ▼
Cooking session reads via view_user_recipe (08) or session handoff (29)
```

---

## Share extension contract

**Product rule:** confirm within 2 seconds; app need not be open; **no model calls in extension**.

**Accepted inputs** (`01-share-sheet-entry.md`):

| Field | Notes |
|---|---|
| `sourceType` | `url`, `video_url`, `image`, `native_media_reference`, `place_url`, `unknown` |
| `sourceUrl` | Nullable for pure image shares |
| `sourceApp` | `tiktok`, `youtube`, `instagram`, `browser`, `unknown` |
| `titleHint`, `previewText`, `thumbnailUrl` | Platform metadata when available |
| `localImageBase64` | Screenshot / recipe photo |
| `sharedAt` | Client timestamp ms |

**Confirmation copy:** `Saved to Brioela. I'll figure out what this is and where it belongs.`

Extension calls `POST /api/shared/import` — **not** `POST /api/recipes/import` unless a future in-app flow already knows the route.

---

## Import job lifecycle

Single job row tracks pipeline state (`02-import-job-workflow.md`). Status enum:

`queued` → `classifying` → `extracting` → `normalizing` → `routing` → `needs_review` | `completed` | `partial` | `failed`

| Status | Meaning |
|---|---|
| `queued` | Row written; workflow not started |
| `classifying` | Shared content classifier running |
| `extracting` | Fetch / transcript / vision |
| `normalizing` | LLM structuring recipe |
| `routing` | Non-recipe destination write |
| `needs_review` | Cookable but meaningful uncertainty |
| `completed` | Recipe saved (or non-recipe routed successfully) |
| `partial` | Source/artifacts saved; full recipe not safe |
| `failed` | Unrecoverable with `failureReason` |

**Idempotency:** duplicate shares (same user + normalized URL hash + window) return existing job — no duplicate recipes.

**Retries:** transient network/model timeouts retry; private/auth-gated URLs, deleted sources, high-confidence non-food → no retry.

---

## Shared content classifier

**Core rule:** share sheet accepts food-related content, not only recipes (`08-shared-content-classifier.md`).

```typescript
type SharedContentClassification = {
  jobId: string
  primaryKind: 'recipe' | 'restaurant_menu' | 'place' | 'product' | 'receipt' | 'food_note' | 'shopping_list' | 'unknown_food' | 'non_food'
  secondaryKinds: string[]
  confidence: number
  reasons: string[]
  recommendedRoute: 'recipe_import' | 'menu_scan' | 'map_place' | 'product_scan' | 'receipt_import' | 'memory_event' | 'needs_user_choice' | 'reject'
}
```

**Classifier lives in 25.** **26** owns menu parsing after `menu_scan` route. Overlap is intentional: one classifier at intake, feature-specific parsers downstream.

Low confidence → one short user choice (`Save as recipe` / `Scan as menu` / `Save place` / `Remember note` / `Ignore`) — no long form.

---

## Source extraction

Artifacts (`03-source-extraction.md`) — evidence, not final recipe:

| Artifact | Source |
|---|---|
| `transcript`, `captions` | Video platforms when available |
| `extractedPageText` | HTTP fetch + visible text / JSON-LD recipe markup |
| `extractedImageText` | GPT-4o mini vision (contrast-enhanced) |
| `thumbnailUrl`, `canonicalUrl`, `title`, `authorName` | Metadata |
| `extractionWarnings` | `low_light`, `partial_crop`, `vision_extraction_uncertain`, etc. |

**Rules:** no full video download in v1 unless platform terms allow; schema.org recipe markup is strong evidence but normalizer validates; never invent missing image text.

**Source quality classification** (`RecipeSourceClassification`) gates whether normalization runs vs classifier route.

---

## Deep public web search (≠ **18** `search_web`)

When shared content is recipe-like but incomplete, the **import workflow** may search public web for corroborating evidence before abandoning reconstruction (`03-source-extraction.md`).

| Aspect | Import deep search (**25**) | `search_web` tool (**18**) |
|---|---|---|
| Trigger | Async import job step 5 | Agent mid-conversation |
| Caller | Workflow worker | Brain `getBrainTools` session |
| Rate limit | Per import job budget | 5 calls / session |
| Purpose | Same-source / creator-linked recipe pages | General factual/research queries |
| Provider | Tavily/Exa (same providers likely) | Tavily factual + Exa research |
| Observability | Job artifacts + attribution | `memory_event` kind `web_search` |

**Rules:** never invent recipe from generic results; prefer same creator/canonical URL; weak evidence → `partial` not fabrication; preserve attribution for all sources used.

---

## Normalization

Canonical shape: `NormalizedRecipeContent` in `normalizedRecipeContentSchema` (`04-recipe-normalization.md`).

**Share import row mapping:**

| Share `sourceType` | `recipes.origin` | `content.read_via` | `recipes.link_url` |
|---|---|---|---|
| `url`, `video_url` | `share_import` | `video` or `webpage` | shared URL |
| `image` | `share_import` | `photo` | null or URL if present |

`content.shared_from` from share payload (`tiktok`, `youtube`, `instagram`, `browser`, `unknown`).

**Fabrication blocked:** no invented ingredients, quantities, or times without evidence. Nullable + `estimated: true` + per-field `confidence`.

**Minimum cookable recipe:** title, ≥2 ingredients, ≥2 ordered steps, attribution, confidence/warnings. Otherwise `partial`.

**Multi-source reconstruction:** anchor on original share; supporting web evidence lower confidence unless strong source match.

---

## Confidence and constraints

**UI thresholds** (`05-confidence-and-constraints.md`):

| Overall confidence | Treatment |
|---|---|
| ≥ 0.85 | Ready — normal cook CTA |
| 0.65–0.84 | Review helpful — warnings before cook |
| 0.40–0.64 | Needs review — edit before cook |
| < 0.40 | Partial — source only |

After normalization, run constraint profile check (hard allergies, intolerances, dietary identity, dislikes, boycotts, medical watchlists when **23** ships).

Result: `clear` | `caution` | `blocked`. Import **still saves** on hard conflict; default CTA becomes review/adapt — not immediate cooking session.

Substitutions are overlays — do not silently rewrite imported recipe (**08** `update_user_recipe` for accepted variants).

**Mira recipe review** (**29** / **30**): escalation for hard conflicts or missing quantities — not owned by **25** runtime, but **25** surfaces the trigger.

---

## Storage and memory events

**User recipe write** (`06-storage-and-library.md`):

- `writeUserRecipe` with `origin = share_import`, `sessionId = null`, `linkUrl` from share, `content` = stringified validated JSON, `title` synced from `content.title`, row `confidence` mirrors content confidence.
- Post-import refinement: **08** tools only — no create tool.

**Source artifacts:** Supabase (or job-scoped storage) tied to `importJobId` — not in `recipes.content`.

**Memory events:**

| kind | When |
|---|---|
| `recipe_imported` | Successful recipe save (`01-memory-event.md`) |
| `shared_content_routed` | Non-recipe route completed (`08`) |

Payload includes `recipeId`, `sourceType`, `shared_from`, `title`, `confidence`, `status`.

---

## User-facing import experience

States (`07-import-status-and-growth-loop.md`):

| User state | Copy | Action |
|---|---|---|
| Processing | "Turning this into a recipe…" | View status |
| Completed | "Recipe imported." | Open recipe |
| Needs review | "…a few details need review." | Review recipe |
| Partial | "Source saved, but I could not fully extract the recipe." | Retry later |

Push completion allowed under **21** rules (not during active session, quiet hours, one-thing rule). In-app completion when user active.

**Growth loop:** TikTok → Share → Brioela → cookable recipe — acquisition via utility, not reposting (**51** boundary).

---

## Create-path boundaries (critical)

| Path | Feature | `origin` | Mechanism |
|---|---|---|---|
| Share sheet / URL import | **25** | `share_import` | `writeUserRecipe` after normalization |
| Cooking session end | **29** | `cooking_session` / `family_capture` | Decision tree + recipe-reconstruction skill + direct insert |
| User manual entry | Future / app UI | `user_written` | Direct insert (no tool today) |
| Agent refinement | **08** | any active row | `update_user_recipe` / `archive_user_recipe` |

**No path uses `create_user_recipe` tool** — by design across **08**, **09-recipes.md**, **25**.

Session-end tree (**29**) does not run on import completion. Import does not increment `cook_count` — only successful cook session end (**08** G4).

---

## 25 vs neighbor boundaries

| In **25** | In separate feature |
|---|---|
| Share extension + `POST /api/shared/import` | Native app shell registration — **01** |
| Classifier + route dispatcher at intake | Menu parsing — **26** |
| Import job + workflow | Upstash client setup — **01** |
| Source extraction + vision for shares | Scanner vision handlers — **24** (reuse pattern) |
| Deep web search in job | `search_web` tool — **18** |
| `writeUserRecipe(share_import)` | Recipe tools + schema — **08** |
| Constraint check orchestration | Constraint matching logic — **07** |
| Condition flags on import | **23** evaluation body |
| Import status UI | Push delivery — **21** |
| Mira review escalation trigger | Mira session DO — **29** / **30** |
| Meal plan eligibility metadata | **34** consumer |

---

## Obsolete / conflicting sources

| Source | Issue | Resolution |
|---|---|---|
| `brioela-specs/02-recipe-ingestion-from-shared-content.md` | `user_recipe` table name; no classifier; no `POST /api/shared/import` | **Prefer build-guide 19** + Brain `recipes` table |
| `00-overview.md` dual `shared_import_job` + `recipe_import_job` | Two job types in overview data model | **Ship single `shared_import_job`** with `route` field; recipe is downstream state |
| `002-recipes-active-status-mismatch.md` | `active` column vs `status` | **Fixed** — use `status` enum (**08**) |
| Ledger recipe-ingestion implementation | No ledger file found | Build from build-guide 19 |
| Session log 020 | Marks build-guide "complete" | **Docs only** — zero production ingestion code |
| `18-search-web` vs ingestion search | Same providers possible | **Separate code paths** — document in **25** and **18** |

---

## Sources

- `build-guide/19-recipe-ingestion/00-overview.md` through `08-shared-content-classifier.md`
- `brioela-specs/02-recipe-ingestion-from-shared-content.md`
- `brioela-specs/20-platform-and-app-distribution.md` (share sheet)
- `brioela-specs/25-viral-growth-and-sharing.md` (acquisition loop)
- `implementable-specs/09-recipes.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/06-constraints.md`
- `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md`
- `build-guide/08-cooking-session/06-session-end-and-recipe.md`
- `_records/session-log/020-recipe-ingestion-complete.md`
- `_records/session-log/021-recipe-ingestion-shared-content-classifier-addendum.md`
- `_records/connections/15-recipe-ingestion-connections.md`
- `_records/build-order/17-layer-recipe-ingestion.md`
- `_features/08-brain-recipe-tools/spec.md`
- `_features/18-brain-web-search/spec.md`
- `_features/29-cooking-session/status.md`
