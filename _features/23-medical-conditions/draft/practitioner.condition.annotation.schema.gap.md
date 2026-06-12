# Draft: practitioner.condition.annotation.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/practitioner.condition.annotation.schema.ts`

Source: `build-guide/22-medical-conditions/06-practitioner-privacy-boundary.md`, `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`

**46-verified-profiles** implements consent UI and write path; **23** owns schema + privacy rules.

---

## Intended production file

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const annotationStatus = ['active', 'revoked', 'archived'] as const

export const practitionerConditionAnnotations = sqliteTable(
	'practitioner_condition_annotations',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		practitionerId: text('practitioner_id').notNull(),
		conditionProfileId: text('condition_profile_id').notNull(),
		note: text('note').notNull(),
		status: text('status', { enum: annotationStatus }).notNull().default('active'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		revokedAt: integer('revoked_at', { mode: 'number' }),
	},
	(table) => [
		check(
			'practitioner_condition_annotations_status_check',
			sql`${table.status} in ('active', 'revoked', 'archived')`,
		),
		index('idx_practitioner_annotations_profile').on(table.userId, table.conditionProfileId, table.status),
	],
)

export type BrainPractitionerConditionAnnotation = typeof practitionerConditionAnnotations.$inferSelect
```

**Consent rule:** Read/write only when **46** verifies `active_conditions` + `condition_annotations` scope granted.
