# Draft: heirloom.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/heirloom.schema.ts`

**Gap (feature 49):** Heirloom bundle header — spec **48** (brioela), feature **49**.

---

```typescript
import { check, index, integer, sqliteTable, text, sql } from '@/database/sqlite/_schema'

export const heirloomRoleValues = ['owner', 'keeper', 'recipient'] as const
export type HeirloomRole = (typeof heirloomRoleValues)[number]

export const heirlooms = sqliteTable(
	'heirloom',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		role: text('role', { enum: heirloomRoleValues }).notNull(),
		cookName: text('cook_name').notNull(),
		cookRelationship: text('cook_relationship'),
		dedicationText: text('dedication_text'),
		coverPhotoRef: text('cover_photo_ref'),
		version: integer('version', { mode: 'number' }).notNull().default(1),
		receivedFrom: text('received_from'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('heirloom_role_check', sql`${table.role} in ('owner', 'keeper', 'recipient')`),
		index('heirloom_user_role_index').on(table.userId, table.role),
	],
)

export type HeirloomRow = typeof heirlooms.$inferSelect
export type NewHeirloomRow = typeof heirlooms.$inferInsert
```
