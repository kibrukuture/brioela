# Draft: heritage.recipe.draft.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/heritage.recipe.draft.schema.ts`

**Gap (feature 49):** Post-session draft before finalize — spec **13**.

---

```typescript
import { index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const heritageRecipeDrafts = sqliteTable(
	'heritage_recipe_draft',
	{
		captureId: text('capture_id').primaryKey(),
		title: text('title').notNull(),
		ingredientsJson: text('ingredients_json').notNull(),
		stepsJson: text('steps_json').notNull(),
		confidenceJson: text('confidence_json').notNull(),
		sourceSessionRef: text('source_session_ref').notNull(),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [index('heritage_draft_capture_id_index').on(table.captureId)],
)

export type HeritageRecipeDraftRow = typeof heritageRecipeDrafts.$inferSelect
export type NewHeritageRecipeDraftRow = typeof heritageRecipeDrafts.$inferInsert
```
