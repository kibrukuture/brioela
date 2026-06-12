# Draft: tonight.delivery.preference.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/tonight.delivery.preference.schema.ts`

**Gap (feature 54):** Learned delivery timing and craving-adjust flag.

**Source:** `build-guide/38-tonight/02-timing-and-delivery.md`, `_features/37-craving-decoder/spec.md`

---

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const tonightDeliveryPreference = sqliteTable('tonight_delivery_preference', {
  userId: text('user_id').primaryKey(),
  learnedDeliveryMinute: integer('learned_delivery_minute'),
  cookingMeal: text('cooking_meal', {
    enum: ['breakfast', 'lunch', 'dinner'],
  }).notNull().default('dinner'),
  coldStartEndsAt: integer('cold_start_ends_at'),
  cravingAdjustUntilLocal: text('craving_adjust_until_local'),
  updatedAt: integer('updated_at').notNull(),
})
```
