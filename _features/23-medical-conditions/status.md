# Status

open

**Medical conditions are docs-complete; production is entirely unshipped.** Build-guide `22-medical-conditions/` (7 files) and `brioela-specs/28-medical-condition-food-profile.md` are authoritative sources. No Brain condition tables, no Supabase `condition_rule` config, no detection/confirm tools, no scan `conditionFlags`, no mobile condition UI. `user_memory` exists for optional mirror only; `constraints` (**07**) is a separate safety path.

**Living catalog:** v1 `MedicalConditionType` list, rule triggers, and surface consumers extend without renumbering — new conditions require reviewed Supabase rules before activation.

# Shipped (partial)

## Brain / schema
- [x] `user_memory` table — can hold `health.conditions` prompt mirror (`user.memory.schema.ts`)
- [x] `constraints` table — **07** allergies/dislikes; not medical conditions (`constraint.schema.ts`)
- [ ] `medical_condition_profiles` Brain SQLite table
- [ ] `medical_condition_candidates` Brain SQLite table
- [ ] `condition_flag_events` Brain SQLite table
- [ ] `practitioner_condition_annotations` Brain SQLite table
- [ ] Condition table migrations in Brain migration chain

## AI / extraction (out of scope for profiles)
- [x] `diagnosis.schema.ts` — empty stub comment only; not wired
- [ ] Condition detection uses behavioral inference + memory_event evidence — not document extraction

## Supabase config
- [ ] `condition_rule` Drizzle schema + migrations
- [ ] `medication_food_interaction_rule` Drizzle schema + migrations
- [ ] Reviewed seed data per v1 condition types
- [ ] Redis rule cache refresh job

## Brain tools / handlers
- [ ] `propose_medical_condition` tool (split 4-file layout)
- [ ] `confirm_medical_condition` tool (split 4-file layout)
- [ ] Activate / deactivate / delete handlers
- [ ] `evaluateConditionRules` helper
- [ ] `readActiveMedicalConditions` repository + Brain RPC
- [ ] `get.brain.tools.ts` registration

## Scanner / verdict (**24** orchestrates; **23** owns evaluation)
- [ ] `check.conditions.helper.ts`
- [ ] `VerdictSchema.conditionFlags` extension
- [ ] Scan UI separate condition flag rows
- [ ] `condition_flag_events` logging

## Downstream consumers
- [ ] Recipe/meal-plan condition filter (**25**, **34**)
- [ ] Menu scanning condition pass (**26**)
- [ ] Map private ranking bias (**28**)
- [ ] Cooking session condition context (**29**)
- [ ] System prompt active-conditions block (**15**)

## Mobile
- [ ] Condition list/detail settings screens
- [ ] "What Brioela knows about me" condition section (`34-universal-visual-intake`)
- [ ] Scan condition flag row components

## Practitioner (**46** implements consent)
- [ ] Annotation schema + read repository boundary
- [ ] Consent scope enforcement

## Tests
- [ ] Condition table migration smoke
- [ ] Rule evaluation unit tests (celiac hard, hypertension soft)
- [ ] Confirm lifecycle tests
- [ ] Scan conditionFlags separation from constraints

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | **No Brain medical condition tables** | `rg medical_condition backend/src/agents/brain` — zero; 18 core schemas only |
| G2 | **No `medical_condition_profiles` schema file** | `_schemas/index.ts` exports constraints, user_memory — no condition schemas |
| G3 | **No detection/confirm Brain tools** | `rg propose_medical_condition backend` — zero |
| G4 | **No Supabase `condition_rule` schema** | `rg condition_rule shared/drizzle` — zero |
| G5 | **No `medication_food_interaction_rule` schema** | Cited in **22**, **34**, **23** — no Drizzle file |
| G6 | **No `evaluateConditionRules` helper** | Spec in `03-condition-rule-config.md` only |
| G7 | **No `readActiveMedicalConditions` RPC** | **24** blocked for condition-aware scans |
| G8 | **`VerdictSchema` has no `conditionFlags`** | `rg conditionFlags shared/validator` — zero |
| G9 | **Scanner constraint check has no condition evaluation** | `03-constraint-check.md` covers constraints + meds + community — not clinical condition rules |
| G10 | **Scan UI contract lacks condition row slot** | `04-scan-result-ui.md` `VerdictSchema` — no `conditionFlags` field |
| G11 | **No mobile condition settings UI** | `rg medical.condition mobile` — only legacy Schnl copy |
| G12 | **System prompt block not built** | `15-brain-system-prompt/spec.md` line 417 — future suffix |
| G13 | **Celiac dual-path (07 constraint vs 23 condition) undefined in code** | Spec says separate rows — no implementation |
| G14 | **Community overlay draft conflates clinical vs cohort tags** | `07-scanner/07-community-product-intelligence.md` `getUserConditionTags(db)` from `user_memory` — must split from `medical_condition_profiles` |
| G15 | **`user_memory.health.conditions` example only** | `03-read-user-memory.md` — no enforcement or operational read path |
| G16 | **No practitioner annotation table** | `06-practitioner-privacy-boundary.md` shape only — **46** blocked |
| G17 | **No condition rule Redis cache** | `03-condition-rule-config.md` cache strategy — not implemented |
| G18 | **Warfarin: condition type vs medications row coordination** | `warfarin_blood_thinner` condition + **22** `medications` — no unified scan merge logic |
| G19 | **No `check.conditions.helper.ts` in scan API** | `rg check.conditions backend/src/api/scan` — zero |
| G20 | **Onboarding has no condition capture** | **03** ambient only — by design; no Brain wiring for post-onboarding detection |

# Blocked by

- **04-brain-foundation** — migration runtime for new tables
- **05-brain-memory-tools** — `memory_event` evidence chain for detection
- **07-brain-constraint-tools** — parallel safety path must ship first; condition flags are additive, not replacement

# Blocks

- **24-scanner** — condition check in scan path (`status.md` lists **23** as blocked-by)
- **46-verified-profiles** — practitioner annotation implementation
- **47-passport** — feature integration lists **23**
- Downstream: **25**, **26**, **28**, **29**, **34** condition-aware filtering

# Sources

- `build-guide/22-medical-conditions/` (all 7 files)
- `brioela-specs/28-medical-condition-food-profile.md`
- `_records/connections/19-medical-conditions-connections.md`
- `_records/build-order/21-layer-medical-conditions.md`
- `_records/session-log/026-medical-conditions-complete.md`
- Neighbor: `_features/07-brain-constraint-tools/`, `_features/22-health-intelligence/`, `_features/24-scanner/status.md`
