# Draft: heirloom.item.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/heirloom.item.schema.ts`

---

```typescript
import { check, index, integer, sqliteTable, text, sql } from '@/database/sqlite/_schema'

export const heirloomItemTypeValues = ['recipe', 'style_profile', 'moment'] as const
export type HeirloomItemType = (typeof heirloomItemTypeValues)[number]

export const heirloomItems = sqliteTable(
	'heirloom_item',
	{
		id: text('id').primaryKey(),
		heirloomId: text('heirloom_id').notNull(),
		itemType: text('item_type', { enum: heirloomItemTypeValues }).notNull(),
		localRef: text('local_ref').notNull(),
		ownerNote: text('owner_note'),
		addedAt: integer('added_at', { mode: 'number' }).notNull(),
		versionAdded: integer('version_added', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'heirloom_item_type_check',
			sql`${table.itemType} in ('recipe', 'style_profile', 'moment')`,
		),
		index('heirloom_item_heirloom_index').on(table.heirloomId),
		index('heirloom_item_version_index').on(table.heirloomId, table.versionAdded),
	],
)

export type HeirloomItemRow = typeof heirloomItems.$inferSelect
export type NewHeirloomItemRow = typeof heirloomItems.$inferInsert
```
