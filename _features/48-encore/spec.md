# Encore — Spec

Feature **48**. Plate-photo dish recreation: the user photographs a dish they are eating, optionally annotates what they taste, and Brioela reconstructs it into a private, cookable, constraint-adapted recipe with per-field confidence — then connects sourcing (Ground, map, pantry), Bela order pre-fill, Mira first-cook refinement, and an optional Discovery Card after the first home cook.

**Not in this feature:** Passport temporary instruction cards (**47** — handoff to third parties, not recipe creation); URL/social share import pipeline (**25** — different entry, `origin = share_import`); product/menu scan verdict pipelines (**24**, **26** — Encore may *read* same-visit menu context from **26**, not run menu parsing); recipe view/update/archive tools (**08** — post-create refinement uses **08** `update_user_recipe` after workflow insert); Discovery Card scrub/generation body (**51** — **48** triggers offer only); Heirloom assembly/send (**49** — may bundle user-owned recipes later; heritage capture path is **13**/**32**); generative grammar renderer (**52**); guard/lexicon/reading-gate tooling.

**Living catalog note:** Product name is **Encore** — never "Dish Recreation" as a product label (lowercase description only). Code namespace: `encore`. Mira understands "Encore this" as capture trigger.

---

## Purpose

Every other intake path starts from something already a recipe or product: barcode (**24**), shared URL/video (**25**), menu (**26**), live family session (**13**). Encore starts from a finished plate the user is tasting *right now*.

```text
Taste it once → photograph → reconstructed private recipe → source locally → cook with Mira → refine → optional share
```

Encore connects existing systems (vision **34**, menu context **26**, recipe schema **08**/**25**, constraints **07**/**23**, Ground **27**, Bela **42**, Mira **29**) — it is not a standalone subsystem.

---

## Product definition

| Term | Meaning |
|---|---|
| **Encore** | Product name for the feature, the capture action, and each reconstructed artifact ("an Encore") |
| **Encore capture** | Explicit recreate action on a plate photo (+ optional voice note) |
| **Encore reconstruction** | Async five-step workflow producing a draft `user_recipe` |
| **Open question** | Unresolved component surfaced as taste-check prompt during first cook |
| **Refinement** | Post-cook field update with evidence (taste-check or user verdict) |
| **Origin context** | Where/when eaten — place id (nullable), city, restaurant name if known |
| **Sourcing status** | Per-ingredient: `have` \| `nearby` \| `hard-to-find` |
| **First cook** | Initial Mira session where open questions converge |
| **Stable** | Reconstruction status when refinement stops — normal library recipe |

**Design principles (non-negotiable):**

- Output is an *interpretation*, always labeled reconstructed — never exact replication.
- Reconstructions are **private** — never community data, never published.
- Capture asks **zero questions** at submit time.
- Uncertain fields use spec **02** `estimated` / confidence conventions — never fabricated certainty.
- Plate photos and voice audio are **discarded** after processing; derived data only.
- Constraint substitutions are **annotated and attributed** — never silent.

---

## Complete component inventory

> **Living snapshot (2026-06-12 audit).** Grep: `build-guide/31-encore/`, `brioela-specs/44-encore.md`, `backend/src/`, `shared/`, `mobile/`, neighbor `_features/08`, `24`, `25`, `26`, `27`, `29`, `40`, `42`, `43`, `47`, `49`, `51`.

| # | Component | Type | In **48**? | Shipped? | Owner / trigger | Primary sources |
|---|---|---|:---:|:---:|---|---|
| 1 | **Plate photo capture entry** | Mobile UX | **Yes** | No | User "Encore" / recreate button | `01-capture-flow.md` |
| 2 | **Voice annotation at capture** | Mobile STT → transcript | **Yes** | No | Optional; audio discarded | `01`, spec **44** |
| 3 | **Passive meal log side effect** | Memory write | **Cross** | No | Encore capture also logs meal memory | spec **34** |
| 4 | **Intent boundary vs visual intake** | Policy | **Yes** | No | Two UI actions, two code paths | spec **34**, `01` |
| 5 | **Automatic context enrichment** | Helper | **Yes** | No | Place, same-visit menu, cuisine priors, meal context | `01` |
| 6 | **`POST /api/encores`** | API | **Yes** | No | Returns `encore_id` <1s | spec **44** |
| 7 | **`GET /api/encores/:id`** | API | **Yes** | No | Status + draft recipe | spec **44** |
| 8 | **`POST /api/encores/:id/refine`** | API | **Yes** | No | Post-cook refinement payload | spec **44** |
| 9 | **Upstash reconstruction workflow** | Durable job | **Yes** | No | Five steps, independent retries | `02-reconstruction-workflow.md` |
| 10 | **Step 1: visual analysis** | LLM vision | **Yes** | No | GPT-4o mini plate extraction — reuses **24** pattern | `02`, `07-scanner/05` |
| 11 | **Step 2: context fusion** | Helper | **Yes** | No | Menu text + voice + place cuisine + priors | `02` |
| 12 | **Step 3: recipe reconstruction** | LLM structured | **Yes** | No | `NormalizedRecipeContent` + confidence map | `02`, **08** schema |
| 13 | **Step 4: constraint adaptation** | Helper | **Yes** | No | Full profile; attributed substitutions | `03`, **07**, **23** |
| 14 | **Step 5: sourcing check** | Helper | **Yes** | No | Pantry / Ground / map statuses | `03`, **27**, **28**, **34** |
| 15 | **`encore` table** | Brain SQLite | **Yes** | No | Sidecar to `recipes` row | `05-share-and-records.md` |
| 16 | **`encore_open_question` table** | Brain SQLite | **Yes** | No | Taste-check prompts | `05` |
| 17 | **`encore_refinement` table** | Brain SQLite | **Yes** | No | Field change audit | `05` |
| 18 | **`recipes.origin = encore`** | Brain SQLite | **Yes** | No | FK `encore.recipe_id` | spec **44** vs **08** enum — **G2** |
| 19 | **`writeEncoreRecipe` insert path** | Repository | **Yes** | No | Direct insert — no `create_user_recipe` tool | **08** rule |
| 20 | **Draft delivery surface** | Mobile in-app | **Yes** | No | High-priority; push if app backgrounded | `02`, **21** |
| 21 | **Culina+ tier preview gate** | **43** consumer | **Cross** | No | Headline + 3 ingredients; capture always stores | spec **44**, **43** |
| 22 | **Bela "get what's missing"** | **42** consumer | **Cross** | No | Pre-filled order from sourcing | `03`, **42** |
| 23 | **`ingredient_not_found` memory event** | **05** + **48** writer | **Cross** | No | Hard-to-find ingredients | `03`, **27** G24 |
| 24 | **Style profile crossover** | **32** consumer | **Cross** | No | "Cook in [name]'s style" — same call as spec **32** | `03` |
| 25 | **First-cook session injection** | **29** consumer | **Cross** | No | Open questions + confidence + technique notes | `04-first-cook-refinement.md` |
| 26 | **Taste-check budget (1–2)** | Mira policy | **Yes** | No | Natural moments only | `04` |
| 27 | **Post-cook refinement writes** | Handler | **Yes** | No | Resolve questions + `encore_refinement` rows | `04` |
| 28 | **Status lifecycle** | State machine | **Yes** | No | `reconstructing→draft→refining→stable` | `05` |
| 29 | **Encores library section** | Mobile | **Yes** | No | Recipe library filter/tab | spec **44** naming |
| 30 | **Discovery Card offer** | **51** consumer | **Cross** | No | After first completed cook — explicit opt-in | `05`, spec **25** |
| 31 | **Food Time Machine hook** | **38** consumer | **Cross** | No | Origin context preserved | `04` |
| 32 | **Growth Mirror evidence** | **40** consumer | **Cross** | No | First-cook session is normal cooking evidence | **40** — no Encore-specific skill |
| 33 | **Heirloom send eligibility** | **49** | **Ambiguous** | No | Spec **48** Heirloom lists heritage capture only | **G33** |
| 34 | **`create_encore` Brain tool** | Tool | **Yes** | No | Agent path for "Encore this" voice | spec **44** namespace |
| 35 | **Acoustic cue authoring** | **39** | **Cross** | No | May write sound cues at reconstruction | `33-acoustic-cooking/02` |
| 36 | **Encore tests** | Tests | **Yes** | No | Workflow, privacy discard, tier preview | — |

### Shipped in repo today (encore-related)

- `build-guide/31-encore/` — **6 files complete** (docs only).
- `brioela-specs/44-encore.md` — primary spec.
- `_records/connections/27-encore-connections.md`, `_records/build-order/28-layer-encore.md`.
- `_records/session-log/038-breakthrough-wave-ten-new-features.md` — spec **44** originally named "Dish Recreation" in session table; product name is Encore.
- **`rg 'encore|Encore' backend/src shared/ mobile/`** — zero product matches.
- `recipeOriginValues` (**08**) — **no `encore` value** (conflict with spec **44** `source_type = 'encore'` prose — **G2**).
- `encore_recreation` `FeatureAction` — draft only in **43** `tier.entitlement.matrix.constant.gap.md`.

---

## Capture moment

One required action: photograph the plate via the **recreate** flow.

| Input | Required | Notes |
|---|---|---|
| Photo(s) | Yes | Multiple angles accepted, never demanded |
| Voice note | No | Transcript attached; audio discarded immediately |
| Location | Auto | Place identity from places DB |
| Same-visit menu scan | Auto if exists | Strongest reconstruction signal (**26**) |
| Cuisine priors | Auto | From scan/recipe history |
| Meal context | Auto | Time of day, other photos this meal |

Acknowledgment copy: *"Working on it — I'll have a recipe shortly."* API returns `encore_id` in under 1 second.

### Intent boundary (spec **34**)

| Path | Trigger | Result |
|---|---|---|
| Universal visual intake | Passive meal photo | Memory log only — **never** reconstruction |
| Encore recreate action | Explicit "I want this forever" / Encore button | Reconstruction + meal-log side effect |

Two UI actions, two code paths. No crossover.

---

## Reconstruction pipeline (Upstash Workflow)

Async multi-step — **not** a streaming Mira session.

```text
1. visual analysis     — GPT-4o mini vision: components, methods, garnishes, structure
2. context fusion      — menu text, voice transcript, place cuisine, user priors
3. recipe reconstruction — structured LLM → NormalizedRecipeContent + per-field confidence
4. constraint adaptation — full profile; every substitution annotated
5. sourcing check      — have / nearby / hard-to-find per ingredient
```

| Target | SLA |
|---|---|
| Capture acknowledgment | < 1 s |
| Draft recipe available | < 30 s |
| Failed sourcing step | Does not block draft — fills in late |

Delivery: high-priority in-app surface; push only if user left app (**21** rules).

Unresolvable components become **open questions** (e.g. "an unidentified green sauce — likely herb-based").

---

## Reconstructed recipe shape

Stored as Brain `recipes` row with **`origin = 'encore'`** (see **G2** for `source_type` prose vs shipped `origin` enum).

Sidecar `encore` row links `recipe_id` and carries:

- `origin_place_id`, `origin_city`, `captured_at`
- `status`: `reconstructing` \| `draft` \| `refining` \| `stable`
- `photo_refs_discarded`: always `true` after processing

Recipe `content` includes reconstruction fields per spec **02** conventions:

- Confidence map (per-ingredient, per-step)
- Technique notes from visual evidence
- Constraint substitution attributions
- `estimated` markers on uncertain quantities

---

## Constraint adaptation and sourcing

| Rule | Behavior |
|---|---|
| Hard allergens | Substitute + annotate "swapped for your allergy" |
| Medical conditions | Apply spec **28** rules + attribution |
| Soft dislikes | Offer substitution; preserve authentic version as note |
| Substitute safety | Must clear full constraint profile — never suggest allergen-containing "easier" swap |

| Sourcing status | Meaning | UI |
|---|---|---|
| `have` | Pantry inference | Green; struck from buy list |
| `nearby` | Ground find or map sighting | Link to find/place |
| `hard-to-find` | No local signal | Closest known source + `ingredient_not_found` event |

**Bela handoff:** "Get what's missing" → standard Bela order creation (**42**) with constraint profile attached.

**Style profile:** "Cook in [name]'s style" reuses spec **32** adaptation — no new mechanism.

---

## First cook — refinement loop

When Mira starts on an Encore recipe, session context additionally carries:

- Open questions
- Confidence map (estimated fields)
- Technique notes

**Taste-check budget:** at most 1–2 questions per session, tied to open questions, at natural moments only.

**Post-cook writes** (extends standard session-end workflow **29**):

- Resolve `encore_open_question` rows
- Insert `encore_refinement` rows (`field_changed`, `old_value`, `new_value`, `evidence`)
- User verdict ("close", "sweeter", …) re-ranks remaining uncertain fields

After 1–2 cooks → `status = stable` — behaves as normal library recipe. Origin context preserved for Food Time Machine (**38**).

Refinement stops when open questions are exhausted. Stable recipes are never re-interrogated.

---

## Share moment (**51** consumer)

After first **completed** home cook — offered once, never automatic:

- Original plate photo beside home-cooked result
- Dish name
- *"tasted in [city], cooked at home with Brioela"*
- City-level location max; EXIF stripped
- **51** owns card generation/scrub pipeline

---

## Tier placement (**43**)

| Action | Gate |
|---|---|
| Encore capture | **Always succeeds** — stored even on Sapor/Luma |
| Full reconstruction view | **Culina+** (`encore_recreation`) |
| Lower tier preview | Headline + first 3 ingredients + inline Culina upgrade |
| Upgrade later | Unlocks already-captured reconstructions |

Spec **19** prose says "Chef tier" = **Culina** in **43** naming. Scanning never gated (Third Law).

---

## Privacy

- Reconstructions, refinements, origin context: private Brain DO only.
- Restaurant identity: place-level from places DB — not raw GPS retention.
- Share card: explicit user action; city precision max.
- No community publishing of reconstructed recipes.

---

## API surface

```typescript
// POST /api/encores
// Body: photo refs (ephemeral upload), optional voiceTranscript, captureContext
// Response: { encoreId, status: 'reconstructing' }

// GET /api/encores/:id
// Response: status, draft recipe when ready, sourcing statuses, open questions

// POST /api/encores/:id/refine
// Body: sessionId, resolutions[], verdict?, fieldUpdates[]
```

Photos processed server-side; refs discarded after step 1.

---

## Boundary clarifications

### **48** vs **47** Passport

| | **48** Encore | **47** Passport |
|---|---|---|
| Input | Plate photo (+ optional voice) | Private constraints + handoff context |
| Output | Private reconstructed recipe | Temporary instruction card for third party |
| Sharing | Optional Discovery Card after home cook (**51**) | Waiter/shopper/caregiver handoff — not social |
| Storage | `encore*` + long-lived `recipes` | `passport*` — expires |
| Travel narrative | "Tasted in Rome, cooked at home" | Translated food-safety instructions |

No table, API, or intent overlap.

### **48** vs **25** recipe ingestion

| | **48** Encore | **25** Share import |
|---|---|---|
| Entry | In-app plate photo recreate action | Share sheet / URL / social content |
| Source evidence | Vision + optional menu context + voice | URL, video, webpage, screenshots |
| `recipes.origin` | `encore` | `share_import` |
| Job store | Brain `encore` status (no Supabase import job) | `shared_import_job` + artifacts |
| Classifier | None — explicit user intent | `classifySharedContent` required |
| Public web search step | No | Yes when artifacts incomplete |
| Tier | Culina+ for full draft; capture always stores | Luma+ for unlimited saves (Sapor cap 3) |

### **48** vs **08** recipe tools

| | **48** | **08** |
|---|---|---|
| Create path | Workflow direct insert `origin=encore` | No create tool |
| Post-create | `update_user_recipe` for refinements | view / update / archive tools |
| Schema | `NormalizedRecipeContent` (**08** validator) | Owns validator + `recipes` DDL |

### **48** vs **49** Heirloom

| | **48** | **49** |
|---|---|---|
| Artifact | Private reconstructed recipe | Heirloom bundle (heritage recipes + style profiles) |
| Send | Not in **48** | `heirloom_send` Culina+; receive always free |
| Overlap | User may want to pass a recreated dish to family | Spec **48** Heirloom assembly lists `heritage_recipe_capture` — Encore recipes not explicitly included (**G33**) |

---

## Success metrics (from spec **44**)

- Capture-to-draft completion rate
- First-cook rate within 30 days
- Refinement convergence (cooks until stable / user stops)
- Bela order conversion from sourcing handoff
- Share card generation rate after first cook
- Culina conversion at reconstruction preview gate

---

## Source documents

### Primary

- `brioela-specs/44-encore.md`
- `build-guide/31-encore/00-overview.md` through `05-share-and-records.md`

### Integration sources

- `brioela-specs/34-universal-visual-intake.md` — intent boundary
- `brioela-specs/02-recipe-ingestion-from-shared-content.md` — recipe schema + confidence
- `brioela-specs/27-restaurant-menu-scanning.md` — same-visit menu context
- `brioela-specs/32-grandma-style-flavor-profile.md` — style crossover
- `brioela-specs/35b-ground-finds-deep-design.md` — `ingredient_not_found`
- `brioela-specs/25-viral-growth-and-sharing.md` — Discovery Card moment
- `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md` — vision extraction pattern
- `build-guide/08-cooking-session/06-session-end-and-recipe.md` — refinement hook point
- `build-guide/33-acoustic-cooking/02-sound-cues-schema.md` — optional cue authoring

### Neighbor feature migrations

- `_features/08-brain-recipe-tools/spec.md`
- `_features/25-recipe-ingestion/spec.md`
- `_features/24-scanner/spec.md`
- `_features/27-ground/spec.md`
- `_features/29-cooking-session/spec.md`
- `_features/40-growth-mirror/spec.md`
- `_features/42-bela/spec.md`
- `_features/43-pricing-tiers/spec.md`
- `_features/47-passport/spec.md`
- `_features/49-heirloom/status.md`
- `_features/51-viral-sharing/status.md`

### Ledgers

- `_records/connections/27-encore-connections.md`
- `_records/build-order/28-layer-encore.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
