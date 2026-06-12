# Draft index — 23-medical-conditions

## Production snapshots (shipped or partial)

| File | Target path | Notes |
|---|---|---|
| `user.memory.schema.production.md` | `backend/src/agents/brain/_schemas/user.memory.schema.ts` | Mirror path for `health.conditions` — not operational |
| `constraint.schema.production.md` | `backend/src/agents/brain/_schemas/constraint.schema.ts` | **07** boundary — allergies, not conditions |
| `diagnosis.schema.production.md` | `backend/src/core/ai/schemas/medical/diagnosis.schema.ts` | Empty stub — not condition profiles |

## Gap / intended snapshots

| File | Target path | Blocked by |
|---|---|---|
| `medical.condition.profile.schema.gap.md` | `_schemas/medical.condition.profile.schema.ts` | **04** migration |
| `medical.condition.candidate.schema.gap.md` | `_schemas/medical.condition.candidate.schema.ts` | **04** |
| `condition.flag.event.schema.gap.md` | `_schemas/condition.flag.event.schema.ts` | **04** |
| `practitioner.condition.annotation.schema.gap.md` | `_schemas/practitioner.condition.annotation.schema.ts` | **04**, **46** |
| `condition.rule.schema.gap.md` | `shared/drizzle/schema/condition.rule.schema.ts` | Supabase migration |
| `medication.food.interaction.rule.schema.gap.md` | `shared/drizzle/schema/medication.food.interaction.rule.schema.ts` | Supabase migration |
| `propose.medical.condition.tool.gap.md` | `_tools/propose.medical.condition.*` | schemas |
| `confirm.medical.condition.tool.gap.md` | `_tools/confirm.medical.condition.*` | schemas |
| `read.active.medical.conditions.repository.gap.md` | `_repositories/read.active.medical.conditions.repository.ts` | schemas, **24** |
| `evaluate.condition.rules.helper.gap.md` | `_helpers/evaluate.condition.rules.helper.ts` | Supabase rules + cache |
| `check.product.conditions.helper.gap.md` | `backend/src/api/scan/_helpers/check.conditions.helper.ts` | **24** orchestration |
| `condition.verdict.schema.gap.md` | `shared/validator/scan.schema.ts` + `medical.condition.schema.ts` | **24** verdict assembly |
| `mobile.health-conditions.gap.md` | `mobile/app/settings/health-conditions.tsx` | Brain API |

## Cross-feature drafts (do not duplicate)

| Feature | Draft |
|---|---|
| **07** | `_features/07-brain-constraint-tools/draft/` — constraint tools |
| **22** | `_features/22-health-intelligence/draft/medications.schema.gap.md` — private med rows |
| **24** | Future `_features/24-scanner/draft/` — scan orchestration |

**Total in this folder:** 16 files (3 production + 12 gap + this index).
