# Draft: mesa.member.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/mesa.member.schema.ts`

**Gap:** No `mesa_member` table.

**Source:** `build-guide/26-mesa/01-mesa-data-model.md`, `brioela-specs/41-mesa.md` § Mesa Member

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const mesaMemberRoleValues = [
	'self',
	'partner',
	'child',
	'elder',
	'guest',
	'caregiver',
	'other',
] as const
export type MesaMemberRole = (typeof mesaMemberRoleValues)[number]

export const mesaMemberAgeBandValues = [
	'child_5_7',
	'child_8_10',
	'child_11_12',
	'teen',
	'adult',
	'elder',
] as const
export type MesaMemberAgeBand = (typeof mesaMemberAgeBandValues)[number]

export const mesaMemberStatusValues = ['active', 'archived', 'pending_invite'] as const
export type MesaMemberStatus = (typeof mesaMemberStatusValues)[number]

export const mesaMember = sqliteTable(
	'mesa_member',
	{
		id: text('id').primaryKey(),
		mesaId: text('mesa_id').notNull(),
		label: text('label').notNull(),
		role: text('role', { enum: mesaMemberRoleValues }).notNull(),
		ageBand: text('age_band', { enum: mesaMemberAgeBandValues }),
		linkedUserId: text('linked_user_id'),
		status: text('status', { enum: mesaMemberStatusValues }).notNull().default('active'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'mesa_member_status_check',
			sql`${table.status} in ('active', 'archived', 'pending_invite')`,
		),
		check('mesa_member_created_at_check', sql`${table.createdAt} >= 0`),
		check('mesa_member_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
		index('mesa_member_mesa_status_index').on(table.mesaId, table.status),
	],
)

export type MesaMemberRow = typeof mesaMember.$inferSelect
export type NewMesaMemberRow = typeof mesaMember.$inferInsert
```
