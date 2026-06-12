# Draft: VerdictSchema conditionFlags extension (gap — not implemented)

Target: `shared/validator/scan.schema.ts`, `shared/validator/medical.condition.schema.ts`

Source: `build-guide/22-medical-conditions/04-scan-verdict-integration.md`, `build-guide/07-scanner/04-scan-result-ui.md`

---

## Intended shared types

```typescript
// shared/validator/medical.condition.schema.ts

import { z } from 'zod'

export const MedicalConditionTypeSchema = z.enum([
	'pregnancy',
	'type_2_diabetes',
	'pre_diabetes',
	'gout',
	'hypertension',
	'high_cholesterol',
	'warfarin_blood_thinner',
	'ibs_low_fodmap',
	'celiac',
	'chronic_kidney_disease',
	'pku',
])

export const ConditionFlagResultSchema = z.object({
	conditionType: MedicalConditionTypeSchema,
	flagLevel: z.enum(['hard', 'soft', 'info']),
	matchedRuleIds: z.array(z.string()),
	trigger: z.string(),
	reason: z.string(),
	confidence: z.number().min(0).max(1),
})

export type ConditionFlagResult = z.infer<typeof ConditionFlagResultSchema>
```

## VerdictSchema extension

```typescript
// Add to shared/validator/scan.schema.ts VerdictSchema

conditionFlags: z.array(ConditionFlagResultSchema).default([]),
conditionGuardrailsUnavailable: z.boolean().default(false),
```

## VerdictTrace extension

```typescript
| { kind: 'condition_rules_checked'; flagCount: number; hardFlagCount: number }
| { kind: 'condition_guardrails_unavailable'; reason: string }
```

## UI contract

- `constraint` field = **07** allergies + **22** medication-food + **22** community associations
- `conditionFlags` = **23** clinical condition rows — rendered as separate rows below standard verdict
- Never merge celiac condition flag into allergy constraint row even when both fire
