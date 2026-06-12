# Encore — Build

Feature **48**. Production paths under `backend/src/agents/brain/_schemas/encore.*.ts`, `backend/src/agents/brain/_handlers/encore/`, `backend/src/agents/brain/_helpers/encore/`, `backend/src/agents/brain/tools/encore/`, `backend/src/api/encores/`, `shared/validator/encore/`, `shared/constants/encore/`, `shared/routes/encore.routes.ts`, `shared/contracts/encore.contract.ts`, and `mobile/features/encore/`. Authoritative Encore sidecar state in user's Brain DO SQLite; ephemeral photo upload via standard media intake (discarded after step 1).

**Scope:** `encore` / `encore_open_question` / `encore_refinement` tables, `recipes.origin = encore` migration, Zod validators, five-step Upstash reconstruction workflow, vision + LLM helpers, constraint adaptation with attribution, Ground/map/pantry sourcing check, `ingredient_not_found` memory writes, Brain handlers + optional tool, API routes, mobile capture + draft surfaces, Culina+ preview gate (**43**), first-cook session context injection hook for **29**, Bela pre-fill entry (**42**), Discovery Card trigger stub for **51**. **Not in 48 build:** Passport handoff (**47**), share import classifier/workflow (**25**), menu scan pipeline body (**26** — read context only), Discovery Card renderer (**51**), Heirloom send (**49**), Ground find API (**27**), Bela order FSM (**42**), Mira session DO body (**29**), tier matrix implementation (**43** — register action only).

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/31-encore/` (6 files) | ✓ docs only |
| `brioela-specs/44-encore.md` | ✓ spec |
| `_records/connections/27-encore-connections.md` | ✓ ledger |
| `_records/build-order/28-layer-encore.md` | ✓ ledger |
| `_records/session-log/038-breakthrough-wave-ten-new-features.md` | ✓ session log |
| Encore Brain tables / workflow / handlers | ✗ |
| `shared/validator/encore/` | ✗ |
| `backend/src/api/encores/` | ✗ |
| `mobile/features/encore/` | ✗ |
| `recipes.origin = encore` | ✗ |
| `encore_recreation` entitlement wired | ✗ (draft in **43** only) |
| Encore tests | ✗ |

**Zero Encore production code.** `rg 'encore|Encore' backend/src shared/ mobile/` — no product matches.

---

## File manifest

### Shared constants + validator (**48**)

| File | Role |
|---|---|
| `shared/constants/encore/encore.status.constant.ts` | `EncoreStatus` union |
| `shared/constants/encore/encore.sourcing.status.constant.ts` | `have` \| `nearby` \| `hard-to-find` |
| `shared/constants/encore/index.ts` | Barrel |
| `shared/validator/encore/encore.capture.schema.ts` | POST body: photos, voiceTranscript, context |
| `shared/validator/encore/encore.schema.ts` | Full Encore + draft response |
| `shared/validator/encore/encore.refine.schema.ts` | Post-cook refinement payload |
| `shared/validator/encore/encore.vision.extraction.schema.ts` | Step 1 structured vision output |
| `shared/validator/encore/index.ts` | Barrel |
| `shared/routes/encore.routes.ts` | `ENCORE_ROUTES` |
| `shared/contracts/encore.contract.ts` | ts-rest create / get / refine |

### Brain SQLite schemas (**48**)

| File | Role |
|---|---|
| `_schemas/encore.schema.ts` | `encore` header row |
| `_schemas/encore.open.question.schema.ts` | `encore_open_question` |
| `_schemas/encore.refinement.schema.ts` | `encore_refinement` |
| `_schemas/recipe.origin.schema.ts` | **Add** `'encore'` to `recipeOriginValues` (**08** co-change) |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add Encore tables + origin enum migration |

### Brain helpers — reconstruction pipeline (**48**)

| File | Role |
|---|---|
| `_helpers/encore/analyze.plate.vision.helper.ts` | Step 1 — GPT-4o mini vision (pattern from **24**) |
| `_helpers/encore/fuse.encore.context.helper.ts` | Step 2 — menu + voice + place + priors |
| `_helpers/encore/reconstruct.encore.recipe.helper.ts` | Step 3 — structured recipe + open questions |
| `_helpers/encore/adapt.encore.constraints.helper.ts` | Step 4 — attributed substitutions |
| `_helpers/encore/check.encore.sourcing.helper.ts` | Step 5 — pantry / Ground / map statuses |
| `_helpers/encore/write.encore.recipe.helper.ts` | Insert `recipes` + `encore` in one transaction |
| `_helpers/encore/enrich.encore.capture.context.helper.ts` | Auto context at capture (place, menu, meal) |
| `_helpers/encore/apply.encore.refinement.helper.ts` | Merge post-cook updates + resolve questions |
| `_helpers/encore/inject.encore.session.context.helper.ts` | Payload for **29** first-cook sessions |
| `_helpers/encore/log.ingredient.not.found.helper.ts` | `ingredient_not_found` memory events (**05**) |
| `_helpers/encore/index.ts` | Barrel |

### Brain handlers (**48**)

| File | Role |
|---|---|
| `_handlers/encore/create.encore.handler.ts` | Accept capture; enqueue workflow; return id |
| `_handlers/encore/get.encore.handler.ts` | Status + draft recipe + sourcing |
| `_handlers/encore/refine.encore.handler.ts` | Post-cook refinement from **29** |
| `_handlers/encore/run.encore.reconstruction.handler.ts` | Workflow step orchestration (or inline in job) |
| `_handlers/encore/index.ts` | Barrel |

### Upstash Workflow (**48**)

| File | Role |
|---|---|
| `backend/src/api/encores/jobs/encore.reconstruction.workflow.ts` | Five-step durable job |

### Brain tools — `tools/encore/` (**48**)

| File | Role |
|---|---|
| `tools/encore/create.encore.tool.ts` | Agent/voice "Encore this" after user confirms photo |
| `tools/encore/index.ts` | Barrel → **19** registry |

### Backend API (**48**)

| File | Role |
|---|---|
| `backend/src/api/encores/encores.route.ts` | Hono mount `/api/encores` |
| `backend/src/api/encores/encores.controller.ts` | Wiring |
| `backend/src/api/encores/_handlers/post.encore.handler.ts` | Create |
| `backend/src/api/encores/_handlers/get.encore.handler.ts` | Get status/draft |
| `backend/src/api/encores/_handlers/post.encore.refine.handler.ts` | Refine |
| `backend/src/api/encores/index.ts` | Module export |

Register in backend app router (**01**).

### Mobile (**48**)

| File | Role |
|---|---|
| `mobile/features/encore/screens/encore.capture.screen.tsx` | Recreate action — distinct from passive meal log |
| `mobile/features/encore/components/encore.draft.sheet.tsx` | High-priority draft arrival UI |
| `mobile/features/encore/components/encore.sourcing.list.tsx` | Per-ingredient statuses + Bela CTA |
| `mobile/features/encore/components/encore.tier.preview.gate.tsx` | Culina+ preview (headline + 3 ingredients) |
| `mobile/features/encore/components/encore.open.questions.badge.tsx` | Pre-cook uncertainty surfacing |
| `mobile/features/encore/hooks/use.encore.reconstruction.hook.ts` | Poll GET until draft |
| `mobile/features/encore/hooks/use.encore.capture.hook.ts` | POST capture |
| `mobile/network/encore/encore.api.ts` | API client |
| Recipe library: Encores section filter | Tab or filter on `origin=encore` |

### Integration entry surfaces (consumers call **48** or read Encore state)

| Surface | Owner | Entry |
|---|---|---|
| Recreate button on camera / plate photo | **48** | Explicit Encore path — not visual intake |
| Mira voice "Encore this" | **48** tool | `create_encore` after photo confirm |
| Same-visit menu context | **26** | Read-only — `enrich.encore.capture.context` |
| Bela "get what's missing" | **42** | From sourcing list on draft recipe |
| First-cook Mira session | **29** | `inject.encore.session.context` |
| Discovery Card offer | **51** | After first cook complete — trigger only |
| Style profile adaptation | **32** | Standard "cook in style" on Encore recipe |
| Find-to-cooking ambient | **27**/**35** | Reads `ingredient_not_found` from **48** |

### Tests (**48**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/encore/adapt.encore.constraints.helper.test.ts` | Attribution + allergen never silent |
| `backend/src/agents/brain/_helpers/encore/check.encore.sourcing.helper.test.ts` | Status assignment |
| `backend/src/api/encores/jobs/encore.reconstruction.workflow.test.ts` | Step isolation + sourcing non-blocking |
| `backend/src/agents/brain/_handlers/encore/refine.encore.handler.test.ts` | Open question resolution |
| Tier preview gate test | Sapor sees 3 ingredients only |

---

## Acceptance criteria

### Data + API

- [ ] `encore`, `encore_open_question`, `encore_refinement` tables migrate in Brain DO (**04**).
- [ ] `recipeOriginValues` includes `encore`; migration backfills none (forward only).
- [ ] `POST /api/encores` returns `encore_id` in <1s; workflow runs async.
- [ ] `GET /api/encores/:id` returns status lifecycle + draft when ready.
- [ ] `POST /api/encores/:id/refine` writes refinements and resolves open questions.
- [ ] Plate photo refs discarded after step 1; `photo_refs_discarded = true`.

### Reconstruction pipeline

- [ ] Five workflow steps with independent retries.
- [ ] Draft available <30s under normal conditions.
- [ ] Sourcing step failure does not block draft delivery.
- [ ] Uncertain fields marked `estimated`; open questions persisted.
- [ ] Never fabricate certainty on unidentifiable components.

### Constraints + sourcing

- [ ] Every hard allergen substitution annotated in recipe view.
- [ ] Medical condition adaptations attributed per spec **28**.
- [ ] Sourcing statuses: `have`, `nearby`, `hard-to-find` on each ingredient.
- [ ] `hard-to-find` writes `ingredient_not_found` memory event (**05** enum extended).
- [ ] Bela handoff pre-fills missing ingredients (**42** standard order path).

### Capture + intent boundary

- [ ] Passive visual intake meal log never triggers reconstruction (**34**).
- [ ] Encore capture also writes normal meal-log memory side effect.
- [ ] Zero questions asked at capture time.
- [ ] Same-visit menu scan text used when present (**26** read path).

### First cook + refinement

- [ ] Mira session receives open questions + confidence map + technique notes (**29** hook).
- [ ] At most 1–2 taste-check questions per first-cook session.
- [ ] Post-cook writes `encore_refinement` rows with evidence.
- [ ] `status` transitions to `stable` after convergence; no re-interrogation.

### Tier (**43**)

- [ ] Capture succeeds on all tiers; reconstruction stored.
- [ ] Sapor/Luma see headline + 3 ingredients + Culina upgrade inline.
- [ ] Culina+ unlocks full draft for stored captures.
- [ ] `encore_recreation` registered in **43** matrix.

### Privacy + share

- [ ] Reconstructions never published to community surfaces.
- [ ] Origin stored at place/city level — not raw GPS retention.
- [ ] Discovery Card offer only after first completed cook; explicit opt-in (**51**).
- [ ] Share card city precision max; EXIF stripped (**51**).

### Integration boundaries

- [ ] No Passport tables or APIs touched (**47**).
- [ ] No share import job tables (**25**).
- [ ] Style profile uses spec **32** call — no fork (**G32** resolve if needed).

### Tests

- [ ] Constraint attribution golden cases.
- [ ] Intent boundary: visual intake route does not call Encore workflow.
- [ ] Tier preview shows exactly 3 ingredients on Sapor.
- [ ] Photo discard enforced after vision step.

---

## Build order dependencies

1. **04-brain-foundation** — Drizzle migrations for Encore tables + `origin` enum.
2. **08-brain-recipe-tools** — `NormalizedRecipeContent`, `writeUserRecipe` pattern (extend for encore).
3. **07-brain-constraint-tools** — constraint profile read for adaptation.
4. **24-scanner** — vision extraction pattern (can stub GPT call initially).
5. **26-menu-scanning** — same-visit menu context read (can stub empty).
6. **27-ground** + **28-map** — sourcing check reads (can stub all `hard-to-find`).
7. **05-brain-memory-tools** — `ingredient_not_found` event kind.
8. **42-bela** — order pre-fill handoff (can stub CTA).
9. **29-cooking-session** — session context injection + refine callback.
10. **43-pricing-tiers** — `encore_recreation` gate.
11. **19-brain-tool-registry** — register `tools/encore/*`.
12. **21-platform-notifications** — draft-ready push when backgrounded.
13. **01-platform-foundation** — API module + workflow host.

**Soft depends:** **32** style profile, **34** pantry inference, **35** find-to-cooking ambient, **39** acoustic cues, **40** growth mirror (inherits sessions), **51** Discovery Card.

**Blocks:** Plate-photo-to-recipe loop; Encore Discovery Card moment; Encore sourcing → Bela conversion path cited in spec **44**.

---

## Draft count

**25** files in `draft/` — 24 gap/intended snapshots + `gap-index.md`.
