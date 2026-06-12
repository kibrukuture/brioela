# Draft: encore.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/encore.schema.ts`

**Gap (feature 48):** `encore` header table in Brain DO SQLite — sidecar to `recipes`.

**Source:** `build-guide/31-encore/05-share-and-records.md`, `brioela-specs/44-encore.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const encoreStatusValues = [
	'reconstructing',
	'draft',
	'refining',
	'stable',
] as const

export type EncoreStatus = (typeof encoreStatusValues)[number]

export const encores = sqliteTable(
	'encore',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		recipeId: text('recipe_id'),
		originPlaceId: text('origin_place_id'),
		originCity: text('origin_city'),
		capturedAt: integer('captured_at', { mode: 'number' }).notNull(),
		status: text('status', { enum: encoreStatusValues }).notNull().default('reconstructing'),
		photoRefsDiscarded: integer('photo_refs_discarded', { mode: 'boolean' })
			.notNull()
			.default(false),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'encore_status_check',
			sql`${table.status} in ('reconstructing', 'draft', 'refining', 'stable')`,
		),
		index('encore_user_status_index').on(table.userId, table.status),
		index('encore_recipe_id_index').on(table.recipeId),
	],
)

export type EncoreRow = typeof encores.$inferSelect
export type NewEncoreRow = typeof encores.$inferInsert
```
