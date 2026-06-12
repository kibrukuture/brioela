# Status

open

**Encore not shipped.** Build-guide **31-encore** is complete (6 files, docs only). Zero Encore Brain tables, zero reconstruction workflow, zero vision/reconstruction helpers, zero API routes, zero mobile Encore surfaces, zero tests. Partial: `recipes` table + `normalizedRecipeContentSchema` (**08**); vision extraction pattern documented in **24** build-guide (not wired for plates); `encore_recreation` `FeatureAction` draft in **43** only; `recipeOriginValues` lacks `encore` (**G2**).

# Shipped in backend (partial / unrelated)

- [x] `build-guide/31-encore/` (6 files) — docs complete per session **038**
- [x] `brioela-specs/44-encore.md` — primary spec
- [x] `_records/connections/27-encore-connections.md` — ledger
- [x] `_records/build-order/28-layer-encore.md` — layer deps
- [x] `recipes` Drizzle schema + `normalizedRecipeContentSchema` (**08** / **04**) — no `encore` origin
- [x] `writeUserRecipe` repository (**08**) — no Encore caller
- [ ] `encore` / `encore_open_question` / `encore_refinement` tables
- [ ] `shared/validator/encore/` + `shared/constants/encore/`
- [ ] `_helpers/encore/` pipeline helpers
- [ ] `_handlers/encore/` + Upstash workflow
- [ ] `tools/encore/` AI tools
- [ ] `/api/encores/*`
- [ ] `mobile/features/encore/`
- [ ] `ingredient_not_found` memory event kind (**05** — **27** G24)
- [ ] Culina+ `encore_recreation` gate wired (**43**)
- [ ] First-cook session injection (**29**)
- [ ] Bela missing-ingredient handoff (**42** G40)
- [ ] Discovery Card trigger (**51**)
- [ ] Encore tests

# Blocked by

- 04-brain-foundation (Encore table migrations)
- 08-brain-recipe-tools (`origin=encore`, direct insert path)
- 24-scanner (vision extraction pattern)
- 26-menu-scanning (same-visit menu context read)
- 27-ground (sourcing check + `ingredient_not_found`)
- 29-cooking-session (first-cook refinement hook)
- 42-bela (order pre-fill)
- 43-pricing-tiers (`encore_recreation`)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No Encore Brain schemas | `rg encore backend/src/agents/brain/_schemas` — zero |
| G2 | **`source_type` vs `origin` naming conflict** | Spec **44** prose `source_type = 'encore'`; shipped `recipe.origin.schema.ts` has no `encore` |
| G3 | No `shared/validator/encore/` | `rg encore shared/validator` — zero |
| G4 | No `shared/constants/encore/` | Status/sourcing enums missing |
| G5 | No `_helpers/encore/` directory | Five-step pipeline not started |
| G6 | No `analyze.plate.vision` helper | `02-reconstruction-workflow.md` step 1 — not built |
| G7 | No `fuse.encore.context` helper | Menu + voice + priors merge — missing |
| G8 | No `reconstruct.encore.recipe` helper | Step 3 structured LLM — missing |
| G9 | No `adapt.encore.constraints` helper | Attributed substitutions — missing |
| G10 | No `check.encore.sourcing` helper | Pantry/Ground/map statuses — missing |
| G11 | No Upstash reconstruction workflow | `02` — no `encore.reconstruction.workflow.ts` |
| G12 | No `create/get/refine` handlers | API surface in spec **44** — missing |
| G13 | No `POST /api/encores` route | `rg encores backend/src/api` — zero |
| G14 | No `tools/encore/` | **19** registry — zero |
| G15 | No `encore.contract.ts` | ts-rest spine missing |
| G16 | No mobile `features/encore/` | `rg encore mobile/` — zero |
| G17 | No capture vs visual-intake boundary | Spec **34** two-path rule — no code |
| G18 | No draft delivery UI / push hook | `02` high-priority surface — missing |
| G19 | No Culina+ preview gate | **43** `encore_recreation` draft only |
| G20 | No `ingredient_not_found` memory kind | **05** enum / **27** G24 — blocks sourcing loop |
| G21 | No Bela "get what's missing" entry | **42** G40 — consumer unwired |
| G22 | No first-cook session injection | **29** `inject.encore.session.context` — missing |
| G23 | No post-cook `encore_refinement` writes | `04-first-cook-refinement.md` — not implemented |
| G24 | No Discovery Card trigger | **51** consumer — offer after first cook unwired |
| G25 | No Encore tests | `rg encore *.test.ts` — zero |
| G26 | Session **038** "Dish Recreation" folder name vs product **Encore** | Ledger table row 44; `build-guide/31-encore/` uses Encore — cosmetic ledger only |
| G27 | No `encore_open_question` taste-check budget enforcement | Mira policy 1–2 questions — no runtime |
| G28 | Photo/audio discard not enforced | No-raw-media rule spec **11**/**34** — no Encore pipeline |
| G29 | Same-visit menu context read unwired | **26** not shipped; `01-capture-flow.md` depends on it |
| G30 | Pantry `have` inference unwired | **34** pantry — sourcing step stub needed |
| G31 | Style profile crossover unwired | Spec **32** call — no Encore recipe entry point |
| G32 | Acoustic cue authoring at reconstruction optional | `33-acoustic-cooking/02` cites Encore — no writer |
| G33 | **Heirloom send of Encore recipes unspecified** | Spec **48** Heirloom lists `heritage_recipe_capture` only — **49** boundary open |
| G34 | Food Time Machine surfacing unwired | Spec **38** cites origin context — no **48** producer beyond stored fields |
| G35 | Sapor 3-recipe cap interaction unclear | Spec **19** caps saves/imports — does Encore capture count before Culina unlock? Spec **44** says capture stores — resolve with **43** |

# 48 vs neighbor boundaries

| In **48** (this feature) | In separate feature |
|---|---|
| Plate capture + reconstruction workflow | Product scan vision (**24**) — different subject |
| `recipes.origin = encore` direct insert | Recipe tools view/update/archive (**08**) |
| Same-visit menu *read* for context | Menu scan pipeline (**26**) |
| Sourcing status + Bela CTA | Bela order FSM (**42**) |
| `ingredient_not_found` write | Find-to-cooking ambient (**27**/**35**) |
| First-cook context + refine API | Mira session runtime (**29**) |
| Culina+ preview gate call | Tier matrix (**43**) |
| Discovery Card *offer* trigger | Card generation/scrub (**51**) |
| Private reconstructed recipe | Passport handoff (**47**) |
| Share sheet / URL import | Recipe ingestion (**25**) |
| Heirloom bundle assembly | Heirloom send/receive (**49**) |

# Sources

- `brioela-specs/44-encore.md`
- `build-guide/31-encore/`
- `_records/connections/27-encore-connections.md`
- `_records/build-order/28-layer-encore.md`
- `_records/session-log/038-breakthrough-wave-ten-new-features.md`
- `_features/47-passport/spec.md` (boundary)
- `_features/25-recipe-ingestion/spec.md` (import boundary)
- `_features/43-pricing-tiers/spec.md` (`encore_recreation`)
