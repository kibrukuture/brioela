# Draft: medical.condition.profile.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/medical.condition.profile.schema.ts`

Source: `build-guide/22-medical-conditions/02-condition-profile-data.md`, `brioela-specs/28-medical-condition-food-profile.md`

---

## Intended production file

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const medicalConditionType = [
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
] as const

const conditionStrictness = ['strict', 'moderate', 'standard'] as const
const conditionProfileStatus = ['active', 'inactive', 'deleted'] as const
const conditionConfirmedBy = [
	'self_voice',
	'self_chat',
	'settings',
	'practitioner_suggested_user_confirmed',
] as const

export const medicalConditionProfiles = sqliteTable(
	'medical_condition_profiles',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		conditionType: text('condition_type', { enum: medicalConditionType }).notNull(),
		strictness: text('strictness', { enum: conditionStrictness }).notNull().default('standard'),
		status: text('status', { enum: conditionProfileStatus }).notNull().default('active'),
		confirmedBy: text('confirmed_by', { enum: conditionConfirmedBy }).notNull(),
		confirmedAt: integer('confirmed_at', { mode: 'number' }).notNull(),
		deactivatedAt: integer('deactivated_at', { mode: 'number' }),
		ruleVersion: text('rule_version').notNull(),
		notes: text('notes'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'medical_condition_profiles_condition_type_check',
			sql`${table.conditionType} in ('pregnancy', 'type_2_diabetes', 'pre_diabetes', 'gout', 'hypertension', 'high_cholesterol', 'warfarin_blood_thinner', 'ibs_low_fodmap', 'celiac', 'chronic_kidney_disease', 'pku')`,
		),
		check(
			'medical_condition_profiles_strictness_check',
			sql`${table.strictness} in ('strict', 'moderate', 'standard')`,
		),
		check(
			'medical_condition_profiles_status_check',
			sql`${table.status} in ('active', 'inactive', 'deleted')`,
		),
		index('idx_medical_condition_profiles_active').on(table.userId, table.status, table.conditionType),
	],
)

export type BrainMedicalConditionProfile = typeof medicalConditionProfiles.$inferSelect
export type NewBrainMedicalConditionProfile = typeof medicalConditionProfiles.$inferInsert
```

**Operational rule:** Scan/recipe/cooking read `status = 'active'` only. `user_memory.health.conditions` is prompt mirror — not source of truth for safety.
