# Draft: mesa.constraint.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/mesa.constraint.schema.ts`

**Gap:** No per-member `mesa_constraint` table.

**Source:** `build-guide/26-mesa/01-mesa-data-model.md`, `03-mesa-tools.md`

**Never:** Write Mesa constraints into personal `constraints` table (**07**).

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const mesaConstraintTypeValues = [
	'hard_allergy',
	'intolerance',
	'dietary_identity',
	'dislike',
	'medical_watchlist',
	'boycott',
] as const

export const mesaConstraintEntityKindValues = [
	'ingredient',
	'category',
	'brand',
	'condition',
	'other',
] as const

export const mesaConstraintSeverityValues = ['hard', 'soft'] as const

export const mesaConstraintSourceValues = [
	'owner_stated',
	'member_stated',
	'imported',
	'inferred_candidate',
] as const

export const mesaConstraint = sqliteTable(
	'mesa_constraint',
	{
		id: text('id').primaryKey(),
		mesaId: text('mesa_id').notNull(),
		memberId: text('member_id').notNull(),
		constraintType: text('constraint_type', { enum: mesaConstraintTypeValues }).notNull(),
		entityKind: text('entity_kind', { enum: mesaConstraintEntityKindValues }).notNull(),
		entityValue: text('entity_value').notNull(),
		severity: text('severity', { enum: mesaConstraintSeverityValues }).notNull(),
		source: text('source', { enum: mesaConstraintSourceValues }).notNull(),
		confirmedByOwner: integer('confirmed_by_owner', { mode: 'boolean' }).notNull().default(false),
		active: integer('active', { mode: 'boolean' }).notNull().default(true),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('mesa_constraint_confirmed_by_owner_check', sql`${table.confirmedByOwner} in (0, 1)`),
		check('mesa_constraint_active_check', sql`${table.active} in (0, 1)`),
		index('mesa_constraint_member_active_index').on(table.memberId, table.active),
	],
)

export type MesaConstraintRow = typeof mesaConstraint.$inferSelect
```
