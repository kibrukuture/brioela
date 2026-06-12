# Medical Conditions — Build

Feature **23**. Production paths under `backend/src/agents/brain/` (condition schemas, handlers, tools, rule evaluation), `shared/drizzle/schema/` (Supabase `condition_rule`, `medication_food_interaction_rule`), `shared/validator/` (verdict extension), `backend/src/api/scan/` (condition check helper — body owned by **23**, called by **24**), and `mobile/` condition settings UX.

**Scope:** Brain SQLite condition tables, detection/confirm/deactivate lifecycle, Supabase versioned rules + cache, `evaluateConditionRules`, `readActiveMedicalConditions` RPC, verdict `conditionFlags`, practitioner annotation schema boundary, mobile view/delete. **Not in 23 build:** constraint tools (**07**), medications table (**22**), scanner handler orchestration (**24**), practitioner consent UI (**46**), system prompt builder block (**15**), community health tables (**22**).

---

## Shipped today

| Area | Status |
|---|---|
| `user_memory` table (mirror path for `health.conditions`) | ✓ (**05**) |
| `constraints` table | ✓ schema only (**07** — not conditions) |
| `diagnosis.schema.ts` | ✓ stub comment only |
| `medical_condition_profiles` Brain table | ✗ |
| `medical_condition_candidates` Brain table | ✗ |
| `condition_flag_events` Brain table | ✗ |
| Supabase `condition_rule` / `medication_food_interaction_rule` | ✗ |
| Condition propose/confirm Brain tools | ✗ |
| `evaluateConditionRules` helper | ✗ |
| `readActiveMedicalConditions` repository/RPC | ✗ |
| `VerdictSchema.conditionFlags` | ✗ |
| Scan condition evaluation wired | ✗ |
| Mobile condition settings UI | ✗ |
| Condition rule cache (Redis) | ✗ |
| Practitioner annotation table | ✗ |
| Tests | ✗ |

---

## File manifest

### Brain SQLite schemas (23)

| File | Role |
|---|---|
| `_schemas/medical.condition.profile.schema.ts` | `medical_condition_profiles` — active/inactive/deleted lifecycle |
| `_schemas/medical.condition.candidate.schema.ts` | `medical_condition_candidates` — pending confirmation |
| `_schemas/condition.flag.event.schema.ts` | `condition_flag_events` — private audit |
| `_schemas/practitioner.condition.annotation.schema.ts` | Annotation rows — **46** writes via consent |
| `_schemas/index.ts` | Export + migration registration |
| `_migrations/*` | Add four tables to Brain migration chain (**04**) |

Column names follow `02-condition-profile-data.md` / `01-condition-detection-confirmation.md` shapes. Prefer snake_case SQL per Brain convention (`constraint.schema.ts` pattern).

### Repositories (23)

| File | Role |
|---|---|
| `_repositories/read.active.medical.conditions.repository.ts` | RPC for scan/recipe/cooking — returns `ActiveMedicalConditionContext[]` |
| `_repositories/read.medical.condition.candidate.repository.ts` | Duplicate candidate guard |
| `_repositories/write.medical.condition.profile.repository.ts` | Insert/update/deactivate/delete |
| `_repositories/write.medical.condition.candidate.repository.ts` | Insert candidate; mark confirmed/dismissed/expired |
| `_repositories/write.condition.flag.event.repository.ts` | Append flag audit rows |
| `_repositories/read.practitioner.annotations.repository.ts` | Consent-scoped read — **46** calls |

### Handlers (23)

| File | Role |
|---|---|
| `_handlers/activate.medical.condition.handler.ts` | Candidate → active profile; pin `ruleVersion` |
| `_handlers/deactivate.medical.condition.handler.ts` | Mark inactive; stop rule application |
| `_handlers/delete.medical.condition.data.handler.ts` | Full deletion path |
| `_handlers/change.condition.strictness.handler.ts` | strict/moderate/standard update |

### Helpers (23)

| File | Role |
|---|---|
| `_helpers/evaluate.condition.rules.helper.ts` | Match ingredients/nutrients/additives/preparation against cached `condition_rule` |
| `_helpers/fetch.condition.rules.helper.ts` | Supabase load + Redis cache by `(conditionType, ruleVersion)` |
| `_helpers/fetch.medication.food.interaction.rules.helper.ts` | Supabase `medication_food_interaction_rule` — shared with **24** scan path |
| `_helpers/build.condition.flag.results.helper.ts` | Map rule hits → `ConditionFlagResult[]` + reason templates |
| `_helpers/sync.health.conditions.memory.mirror.helper.ts` | Optional `user_memory.health.conditions` prompt mirror |
| `_helpers/check.product.conditions.helper.ts` | Product + active profiles → `ScanConditionEvaluation` — **24** calls |

### Brain tools — split layout (2 × 4 = 8 files, mirror **07**)

| Tool | `.tool.ts` | `_schemas/` | `_prompts/` | `_executables/` |
|---|---|---|---|---|
| `propose_medical_condition` | `propose.medical.condition.tool.ts` | `propose.medical.condition.schema.ts` | `propose.medical.condition.prompt.ts` | `propose.medical.condition.executable.ts` |
| `confirm_medical_condition` | `confirm.medical.condition.tool.ts` | `confirm.medical.condition.schema.ts` | `confirm.medical.condition.prompt.ts` | `confirm.medical.condition.executable.ts` |

**Permission matrix (intended):** Same as **07** — propose in `chat` + `cooking`; confirm in `chat` only. Register in `_tools/get.brain.tools.ts` (**19**).

### Supabase Drizzle schemas (23)

| File | Role |
|---|---|
| `shared/drizzle/schema/condition.rule.schema.ts` | `condition_rule` versioned config |
| `shared/drizzle/schema/medication.food.interaction.rule.schema.ts` | Reviewed med–food rules |
| `shared/drizzle/migrations/*` | Postgres migrations |
| `shared/drizzle/seed/condition-rules.seed.ts` | Initial reviewed rules per v1 condition types — human-reviewed only |

### Shared validator (23 body; **24** consumes)

| File | Role |
|---|---|
| `shared/validator/scan.schema.ts` | Add `conditionFlags: z.array(ConditionFlagResultSchema)` to `VerdictSchema` |
| `shared/validator/medical.condition.schema.ts` | `MedicalConditionType`, `ConditionFlagResult`, `ActiveMedicalConditionContext` enums/types |

### Scan integration (23 helper; **24** orchestrates)

| File | Role | Owner |
|---|---|---|
| `backend/src/api/scan/_helpers/check.conditions.helper.ts` | Brain RPC → `evaluateConditionRules` | **23** body; **24** calls |
| `backend/src/api/scan/_helpers/build.verdict.helper.ts` | Merge `conditionFlags` into verdict assembly | **24** — extend when **23** ships |

### Mobile (23)

| File | Role |
|---|---|
| `mobile/app/settings/health-conditions.tsx` | List active/inactive conditions |
| `mobile/app/settings/health-conditions/[type].tsx` | Detail, strictness, deactivate, delete |
| `mobile/network/brain/conditions.api.ts` | Brain-backed CRUD/read |
| `mobile/components/scan/condition-flag-rows.tsx` | Separate UI rows below standard verdict |

### System prompt (15 owns builder; 23 owns data contract)

| File | Role |
|---|---|
| `_helpers/build.active.conditions.prompt.block.helper.ts` | Compact block for **15** suffix injection |

---

## Dependency order

```text
04-brain-foundation (migration runtime)
  → 05-brain-memory-tools (memory_event evidence for detection)
  → 07-brain-constraint-tools (parallel path — do not merge)
  → 23-medical-conditions (this feature)
      → 24-scanner (orchestrates condition check in scan path)
      → 25-recipe-ingestion, 34-pantry-meal-plan, 26-menu-scanning, 28-map, 29-cooking-session (consumers)
      → 46-verified-profiles (practitioner annotations — after 23 schema)
```

**22-health-intelligence** can ship in parallel for `medications` table; `medication_food_interaction_rule` config is **23** Supabase schema consumed by both **22** and **24**.

---

## Acceptance criteria

### Detection and confirmation
- [ ] Voice/chat condition mention creates `medical_condition_candidates` row with `pending_confirmation` — does **not** activate rules
- [ ] Agent asks confirmation once with food-guidance disclaimer; explicit yes activates profile
- [ ] Ambiguous conditions (gout) prompt strict vs moderate before activation
- [ ] Deactivation via voice/settings stops rule application immediately
- [ ] No reactivation without new confirmation

### Profile storage
- [ ] Active profiles live only in Brain DO SQLite — zero identifiable condition rows in Supabase
- [ ] Multiple active conditions supported; conflicts resolve to safer output with explanation
- [ ] Full deletion removes profiles, flag events, and revokes practitioner annotations for deleted condition
- [ ] `user_memory.health.conditions` mirror (if used) is not operational source for scan safety

### Rule config
- [ ] `condition_rule` and `medication_food_interaction_rule` in Supabase with `ruleVersion`, `evidenceSource`, review metadata
- [ ] No hardcoded condition logic in Brain DO — evaluation reads cached config
- [ ] Rule fetch failure → caution/unknown for hard conditions — never false green
- [ ] LLM cannot write active production rules without human review path

### Scan integration (**24** calls **23**)
- [ ] Condition flags returned as **separate** `conditionFlags[]` — not merged into `constraint.matches`
- [ ] Display order: hard allergy → standard verdict → condition rows → expanded detail
- [ ] Celiac + gluten → `hard` red condition row
- [ ] PKU + phenylalanine/aspartame → `hard` red condition row
- [ ] Incomplete ingredient data → uncertainty copy for hard conditions
- [ ] `condition_flag_events` logged privately — not in community tables
- [ ] Community health associations (**22**) remain separate — never replace clinical condition flags

### Downstream surfaces
- [ ] Recipe/meal-plan: hard conflicts hidden by default; soft conflicts ranked lower with flags
- [ ] Menu scanning: condition rules on parsed dishes; unknown ingredients → caution
- [ ] Map: private ranking only — no public medical labels on POIs
- [ ] Cooking session: compact active condition context in Mira prompt

### Privacy and boundaries
- [ ] Conditions never in Ground, community notes, shared map, ads, or default export/share
- [ ] Medical boundary copy enforced — no diagnose/treat/prescribe language
- [ ] Practitioner cannot set condition without user confirm; annotations consent-scoped (**46**)
- [ ] Kids mode / viral sharing / passport scrub medical conditions by default

### Tests
- [ ] Brain migration smoke for three condition tables
- [ ] `evaluateConditionRules` unit tests: celiac hard, hypertension soft, warfarin info
- [ ] Confirm tool: candidate → active profile with pinned `ruleVersion`
- [ ] Scan helper: `conditionFlags` separate from constraint payload
- [ ] Rule cache miss / Supabase failure → fail-safe caution

---

## Cross-feature drafts (do not duplicate)

| Feature | Owns |
|---|---|
| **07** | `constraint.schema.ts`, propose/confirm constraint tools |
| **22** | `medications.schema.ts`, community-health schema, HealthInsightAgent |
| **24** | `check.constraints.helper.ts`, `build.verdict.helper.ts`, scan handler |
| **15** | System prompt builder — calls **23** active-conditions block helper |
| **46** | Practitioner consent UI + annotation write executables |
