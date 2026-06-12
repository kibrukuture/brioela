# Draft: meal.plan.slot.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/meal.plan.slot.schema.ts`

**Gap (feature 34):** Day × meal_type slots with per-ingredient at-home vs to-buy status.

**Source:** `brioela-specs/33-minimum-spend-meal-plan.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const mealTypeValues = ['breakfast', 'lunch', 'dinner'] as const
export type MealType = (typeof mealTypeValues)[number]

export const mealPlanSlots = sqliteTable('meal_plan_slot', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull(),
  dayIndex: integer('day_index').notNull(),
  mealType: text('meal_type').notNull().$type<MealType>(),
  recipeId: text('recipe_id').notNull(),
  ingredientStatusJson: text('ingredient_status_json').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type MealPlanSlotRow = typeof mealPlanSlots.$inferSelect
export type InsertMealPlanSlotRow = typeof mealPlanSlots.$inferInsert
```

`ingredient_status_json`: `{ ingredients: [{ name, status: 'at_home' | 'to_buy', upc?: string }] }`.

Indexes: `(plan_id, day_index, meal_type)` unique.
