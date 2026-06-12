# Draft: tonight.answer.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/tonight.answer.schema.ts`

**Gap (feature 54):** Brain SQLite `tonight_answer` table.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § Data Model, `build-guide/38-tonight/03-learning-loop.md`

---

```typescript
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const tonightAnswer = sqliteTable(
  'tonight_answer',
  {
    answerId: text('answer_id').primaryKey(),
    userId: text('user_id').notNull(),
    dateLocal: text('date_local').notNull(),
    recipeId: text('recipe_id').notNull(),
    swapRecipeIdsJson: text('swap_recipe_ids_json').notNull(),
    reasoningTagsJson: text('reasoning_tags_json').notNull(),
    headline: text('headline').notNull(),
    subline: text('subline'),
    pickupItemJson: text('pickup_item_json'),
    documentJson: text('document_json').notNull(),
    generatedAt: integer('generated_at').notNull(),
    deliveredAt: integer('delivered_at'),
    deliveryChannel: text('delivery_channel', {
      enum: ['in_app', 'push'],
    }),
    response: text('response', {
      enum: ['cooked', 'swapped', 'opened', 'dismissed', 'ignored'],
    }),
    respondedAt: integer('responded_at'),
    swapChosenRecipeId: text('swap_chosen_recipe_id'),
  },
  (table) => ({
    userDateUnique: uniqueIndex('tonight_answer_user_date_unique').on(
      table.userId,
      table.dateLocal,
    ),
  }),
)
```
