# Acoustic Cooking — Build

Feature **39**. Production paths under `backend/src/agents/mira/_prompts/` (acoustic awareness block), `backend/src/agents/mira/_helpers/` (instruction assembly + session recipe formatting), `backend/src/agents/brain/_schemas/vision.event.schema.ts`, `shared/validator/acoustic-cooking/`, Brain RPC handlers for intervention event writes, post-session learned-cue writeback, and metrics helpers. **No new DO class. No audio pipeline changes.**

**Depends on:** **29** MiraSession + `buildSystemInstruction` hook + Gemini audio path; **30** speech suppression (user-speaking hard block); **08** recipe schema + `update_user_recipe`; **11** session lifecycle for `session_id` FK; **04** Brain migrations spine.  
**Soft depends:** **25** ingestion may author `sound_cue`; **40** consumes `vision_event` for heat-control evidence; **43** Chef+ gate (ships with audio session, not separate flag).  
**Blocks:** **40-growth-mirror** acoustic heat-control dimension; **29** G34 acoustic integration acceptance.

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/33-acoustic-cooking/` (4 files) | ✓ docs only |
| `brioela-specs/46-acoustic-cooking-intelligence.md` | ✓ spec |
| `_records/connections/29-acoustic-cooking-connections.md` | ✓ ledger |
| `_records/build-order/30-layer-acoustic-cooking.md` | ✓ ledger |
| Cross-refs in spec **10**, **11** | ✓ append-only |
| `NormalizedRecipeContent` steps schema | ✓ — **no** `sound_cue` field |
| `vision_event` Brain table | ✗ |
| Acoustic awareness prompt block | ✗ |
| Intervention event write path | ✗ |
| Learned cue writeback | ✗ |
| Acoustic metrics | ✗ |
| Acoustic tests | ✗ |
| MiraSession / Gemini audio path | ✗ (**29**) |

**Zero acoustic production code.** `rg 'acoustic|sound_cue|soundCue|evidence_source|vision_event' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared validator (**39**)

| File | Role |
|---|---|
| `shared/validator/acoustic-cooking/evidence.source.schema.ts` | `visual \| acoustic \| fused` Zod enum |
| `shared/validator/acoustic-cooking/intervention.event.type.schema.ts` | Event type constants + Zod |
| `shared/validator/acoustic-cooking/sound.cue.schema.ts` | `sound_cue` string rules (nullable, max length) |
| `shared/validator/acoustic-cooking/index.ts` | Barrel |

### Recipe schema extension (**39** + **08**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_schemas/normalized.recipe.content.schema.ts` | Add optional `soundCue: z.string().nullable()` to `importedStepSchema` |
| `shared/validator/recipe/imported.step.schema.ts` | Mirror if shared export exists |

### Brain SQLite — intervention events (**39**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_schemas/vision.event.schema.ts` | `vision_event` table + `evidence_source` check |
| `backend/src/agents/brain/_schemas/index.ts` | Export + migration registration (**04**) |
| `backend/src/agents/brain/_migrations/*` | Add `vision_event` table (or alter add column if table ships with **11** first) |

### Mira prompts (**39**)

| File | Role |
|---|---|
| `backend/src/agents/mira/_prompts/acoustic.awareness.prompt.ts` | `ACOUSTIC_AWARENESS_BLOCK` text per `01-prompt-extension.md` |
| `backend/src/agents/mira/_constants/intervention.event.types.ts` | `heat_warning`, `boil_over_warning`, etc. |

### Mira helpers (**39**)

| File | Role |
|---|---|
| `backend/src/agents/mira/_helpers/append-acoustic-instruction-block.helper.ts` | Concatenate acoustic block into cooking system instruction |
| `backend/src/agents/mira/_helpers/format-recipe-steps-for-session.helper.ts` | Include `sound_cue` in recipe slice for Gemini setup |
| `backend/src/agents/mira/_helpers/map-intervention-to-evidence-source.helper.ts` | Classify visual/acoustic/fused from session mode + model metadata |
| `backend/src/agents/mira/_helpers/record-intervention-event.helper.ts` | Fire-and-forget Brain RPC after acoustic/visual intervention |
| `backend/src/agents/mira/_helpers/should-weight-acoustic-evidence.helper.ts` | Mic-distance proxy hints for prompt variant (optional v2) |

### Brain handlers / RPC (**39**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_handlers/write-intervention-event.handler.ts` | Insert `vision_event` row; validate `evidence_source` |
| `backend/src/agents/brain/_rpc/mira.intervention.rpc.ts` | Zod for Mira → Brain intervention write |
| `backend/src/agents/brain/_handlers/learn-sound-cue-from-session.handler.ts` | Post-session: write learned `sound_cue` on recipe step |
| `backend/src/agents/brain/_helpers/acoustic/extract-intervention-events-from-transcript.helper.ts` | Fallback extraction for **40** when live write missed |
| `backend/src/agents/brain/_helpers/acoustic/emit-acoustic-metric.helper.ts` | FP rate, useful intervention counters |

### Integration hooks (**29** owns call sites — **39** owns content)

| File | Role |
|---|---|
| `backend/src/agents/mira/_helpers/build-system-instruction.helper.ts` | **29** — call `appendAcousticInstructionBlock()` for cooking scene |
| `backend/src/agents/mira/mira-session.agent.ts` | **29** — call `recordInterventionEvent` when model speaks on risk (integration TBD) |

### Recipe ingestion (**25** — optional author)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/recipe-ingestion/extract-sound-cue-from-step.helper.ts` | Author `sound_cue` when source text implies sound |

### Tests (**39**)

| File | Role |
|---|---|
| `backend/src/agents/mira/_helpers/append-acoustic-instruction-block.helper.test.ts` | Block present; includes 60s rule text |
| `backend/src/agents/brain/_handlers/write-intervention-event.handler.test.ts` | `evidence_source` check constraint |
| `shared/validator/acoustic-cooking/sound.cue.schema.test.ts` | Rejects time/temp-only cues (lint rule optional) |
| `backend/src/agents/brain/_schemas/normalized.recipe.content.schema.test.ts` | Round-trip step with `soundCue` |

---

## Acceptance criteria

### Prompt + session injection

- [ ] `ACOUSTIC_AWARENESS_BLOCK` includes all content requirements from `01-prompt-extension.md`
- [ ] Block appended in **voice-only** and **audio+vision** cooking sessions
- [ ] Block **not** appended to non-cooking scenes (`bela_shopper`, etc.)
- [ ] Recipe session payload includes `sound_cue` per step when present on active recipe
- [ ] Steps without `sound_cue` still receive risk-intervention instructions
- [ ] No new Gemini connection or audio transport code in **39** files

### Schema

- [ ] `importedStepSchema` accepts optional `soundCue: string | null`
- [ ] Existing recipes without field deserialize unchanged
- [ ] `vision_event.evidence_source` enforces `visual | acoustic | fused`
- [ ] No raw audio columns anywhere

### Interventions + events

- [ ] Five acoustic event types mappable to `vision_event.event_type`
- [ ] `step_confirmed` from acoustic cue uses same advance flow as visual (**11**)
- [ ] Fused sessions write `evidence_source = 'fused'` when both senses contributed
- [ ] Derived events only — no audio blobs
- [ ] Live write OR post-session extraction path documented and one path shipped

### Speech interaction (**30**)

- [ ] User-speaking hard block prevents proactive observation ticks during user speech
- [ ] Acoustic model-initiated speech follows 60s no-repeat in system instruction
- [ ] No separate acoustic classifier invoked

### Post-session

- [ ] Learned `sound_cue` writeback optional after acoustic `step_confirmed`
- [ ] Writeback uses **08** `update_user_recipe` / direct update — no new tool

### Tier + privacy

- [ ] Feature active only when Mira audio session running (Chef+ per **19**)
- [ ] No passive mic; no session → no acoustic logic
- [ ] User-facing description states session-scoped listening

### Metrics

- [ ] Acoustic FP rate (dismiss <2s) instrumented
- [ ] Metric wired to prompt assertiveness config (quieter on high FP)

### Boundaries (must not ship in **39** by mistake)

- [ ] No `AcousticCookingAgent` or Brain `subAgent()` spawn
- [ ] No `soundClassify` / DSP / on-device ML model
- [ ] No second WebSocket or parallel audio pipeline
- [ ] No chop-detection acoustic events (vision only)
- [ ] No changes to SFU PCM path (**29** owns)

### Consumers

- [ ] **40** can query `vision_event` where `evidence_source in ('acoustic','fused')` for heat-control
- [ ] **25** may populate `sound_cue` without **39** code changes beyond schema

---

## Build order (within **39**)

1. Shared validators + `evidence_source` enum
2. `vision_event` schema + migration
3. `ACOUSTIC_AWARENESS_BLOCK` prompt constant
4. `appendAcousticInstructionBlock` + unit test
5. `soundCue` on `importedStepSchema`
6. `formatRecipeStepsForSession` helper
7. Brain `writeInterventionEvent` handler + Mira RPC
8. Wire into **29** `buildSystemInstruction` (when **29** lands)
9. Learned cue writeback handler
10. Metrics + FP gate hook
11. Tests

**Prerequisite:** **29** G1–G6 (MiraSession + Gemini audio) before integration acceptance.

---

## Obsolete / misleading records

| Record | Issue |
|---|---|
| `_records/build-order/30-layer-acoustic-cooking.md` | "Layer 30" in build-order ≠ feature folder **39** |
| `build-guide/33-acoustic-cooking/00-overview.md` Depends On `30-mira` | Maps to **30** mira-speech-engine in `_features/` |
| `build-guide/33-acoustic-cooking/00-overview.md` Depends On `19-recipe-ingestion` | Maps to **25** recipe-ingestion |
| `_records/session-log/038` folder `33-acoustic-cooking` | Build-guide index 33; feature index **39** |
| Spec **11** `vision_session` table | Not in backend; may collapse to `sessions` + `vision_event` only at implementation |
