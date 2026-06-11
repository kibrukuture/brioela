# Draft: constraint.schema.ts

Target: `backend/src/agents/brain/_schemas/constraint.schema.ts`

```ts
import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const constraintKind = ['hard_allergy', 'intolerance', 'dislike', 'dietary_identity', 'boycott'] as const
const entityKind = ['ingredient', 'category', 'brand', 'place'] as const
const constraintStatus = ['proposed', 'confirmed', 'auto_confirmed', 'rejected'] as const
const confirmationSource = ['user_explicit', 'behavioral_threshold'] as const

export const constraints = sqliteTable(
	'constraints',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		constraintType: text('constraint_type', { enum: constraintKind }).notNull(),
		entityKind: text('entity_kind', { enum: entityKind }).notNull(),
		entityValue: text('entity_value').notNull(),
		status: text('status', { enum: constraintStatus }).notNull().default('proposed'),
		confidence: real('confidence').notNull().default(0.5),
		evidence: text('evidence').notNull().default('[]'),
		surfacedCount: integer('surfaced_count', { mode: 'number' }).notNull().default(0),
		lastSurfacedAt: integer('last_surfaced_at', { mode: 'number' }),
		confirmationSource: text('confirmation_source', { enum: confirmationSource }),
		notes: text('notes'),
		proposedAt: integer('proposed_at', { mode: 'number' }).notNull(),
		confirmedAt: integer('confirmed_at', { mode: 'number' }),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'constraints_constraint_type_check',
			sql`${table.constraintType} in ('hard_allergy', 'intolerance', 'dislike', 'dietary_identity', 'boycott')`,
		),
		check('constraints_entity_kind_check', sql`${table.entityKind} in ('ingredient', 'category', 'brand', 'place')`),
		check(
			'constraints_status_check',
			sql`${table.status} in ('proposed', 'confirmed', 'auto_confirmed', 'rejected')`,
		),
		check(
			'constraints_confirmation_source_check',
			sql`${table.confirmationSource} is null or ${table.confirmationSource} in ('user_explicit', 'behavioral_threshold')`,
		),
		check('constraints_evidence_json_array_check', sql`json_valid(${table.evidence}) and json_type(${table.evidence}) = 'array'`),
		check('constraints_confidence_check', sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
		check('constraints_surfaced_count_check', sql`${table.surfacedCount} >= 0`),
		check('constraints_last_surfaced_at_check', sql`${table.lastSurfacedAt} is null or ${table.lastSurfacedAt} >= 0`),
		check('constraints_proposed_at_check', sql`${table.proposedAt} >= 0`),
		check('constraints_confirmed_at_check', sql`${table.confirmedAt} is null or ${table.confirmedAt} >= ${table.proposedAt}`),
		check('constraints_updated_at_check', sql`${table.updatedAt} >= ${table.proposedAt}`),
		index('constraints_type_status_index').on(table.constraintType, table.status),
		index('constraints_entity_status_index').on(table.entityKind, table.entityValue, table.status),
		index('constraints_surfaced_index').on(table.lastSurfacedAt).where(sql`status = 'proposed'`),
	],
)

export type BrainConstraint = typeof constraints.$inferSelect
export type NewBrainConstraint = typeof constraints.$inferInsert
```
