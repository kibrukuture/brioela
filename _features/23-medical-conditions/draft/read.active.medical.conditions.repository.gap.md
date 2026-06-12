# Draft: read.active.medical.conditions.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/read.active.medical.conditions.repository.ts`

Source: `build-guide/22-medical-conditions/02-condition-profile-data.md`, `build-guide/07-scanner/03-constraint-check.md` (Brain RPC pattern)

---

## Intended production file

```typescript
import { and, eq } from 'drizzle-orm'
import type { DrizzleDB } from '@/types/db'
import { medicalConditionProfiles } from '@/agents/brain/_schemas/medical.condition.profile.schema'

export type ActiveMedicalConditionContext = {
	conditionType: string
	strictness: 'strict' | 'moderate' | 'standard'
	ruleVersion: string
	displayName: string
}

const DISPLAY_NAMES: Record<string, string> = {
	pregnancy: 'Pregnancy',
	type_2_diabetes: 'Type 2 diabetes',
	pre_diabetes: 'Pre-diabetes',
	gout: 'Gout',
	hypertension: 'Hypertension',
	high_cholesterol: 'High cholesterol',
	warfarin_blood_thinner: 'Blood thinners',
	ibs_low_fodmap: 'IBS / low-FODMAP',
	celiac: 'Celiac disease',
	chronic_kidney_disease: 'Chronic kidney disease',
	pku: 'PKU',
}

export function readActiveMedicalConditions(db: DrizzleDB, userId: string): ActiveMedicalConditionContext[] {
	const rows = db
		.select()
		.from(medicalConditionProfiles)
		.where(and(eq(medicalConditionProfiles.userId, userId), eq(medicalConditionProfiles.status, 'active')))
		.all()

	return rows.map((row) => ({
		conditionType: row.conditionType,
		strictness: row.strictness,
		ruleVersion: row.ruleVersion,
		displayName: DISPLAY_NAMES[row.conditionType] ?? row.conditionType,
	}))
}
```

**Brain RPC:** Expose via internal `POST /read-active-medical-conditions` — **24** scan handler and recipe/cooking consumers call this, not direct SQLite from Worker.

**Not this repository:** Community `reported_condition_tags` (**22**) — separate lookup path.
