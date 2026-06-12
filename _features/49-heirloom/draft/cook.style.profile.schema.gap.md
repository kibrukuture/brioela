# Draft: cook.style.profile.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/cook.style.profile.schema.ts`

**Gap (feature 49):** Named cook style profile — spec **32**.

---

```typescript
import { index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const cookStyleProfiles = sqliteTable(
	'cook_style_profile',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		cookName: text('cook_name').notNull(),
		cookRelationship: text('cook_relationship'),
		sessionIdsJson: text('session_ids_json').notNull(),
		styleSummaryText: text('style_summary_text').notNull(),
		coverPhotoRef: text('cover_photo_ref'),
		extractedAt: integer('extracted_at', { mode: 'number' }).notNull(),
		deletionRequestedAt: integer('deletion_requested_at', { mode: 'number' }),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		index('cook_style_profile_user_index').on(table.userId),
		index('cook_style_profile_cook_name_index').on(table.userId, table.cookName),
	],
)

export type CookStyleProfileRow = typeof cookStyleProfiles.$inferSelect
export type NewCookStyleProfileRow = typeof cookStyleProfiles.$inferInsert
```
