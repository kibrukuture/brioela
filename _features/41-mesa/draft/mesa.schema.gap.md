# Draft: mesa.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/mesa.schema.ts`

**Gap:** No `mesa` header table in owner Brain DO.

**Source:** `build-guide/26-mesa/01-mesa-data-model.md`, `brioela-specs/41-mesa.md` § Account Model

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const mesaStatusValues = ['active', 'archived'] as const
export type MesaStatus = (typeof mesaStatusValues)[number]

export const mesa = sqliteTable(
	'mesa',
	{
		id: text('id').primaryKey(),
		ownerUserId: text('owner_user_id').notNull(),
		displayName: text('display_name'),
		status: text('status', { enum: mesaStatusValues }).notNull().default('active'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('mesa_status_check', sql`${table.status} in ('active', 'archived')`),
		check('mesa_created_at_check', sql`${table.createdAt} >= 0`),
		check('mesa_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
		index('mesa_owner_status_index').on(table.ownerUserId, table.status),
	],
)

export type MesaRow = typeof mesa.$inferSelect
export type NewMesaRow = typeof mesa.$inferInsert
```
