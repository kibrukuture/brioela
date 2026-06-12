# Draft: meal.plan.shopping.list.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/meal.plan.shopping.list.schema.ts`

**Gap (feature 34):** Shopping list delta rows — plan ingredients minus inventory estimate.

**Source:** `brioela-specs/33-minimum-spend-meal-plan.md`, `build-guide/14-pantry-meal-plan/04-shopping-list-and-cost.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const shoppingListItemStatusValues = [
  'to_buy',
  'already_have',
  'bought',
] as const
export type ShoppingListItemStatus = (typeof shoppingListItemStatusValues)[number]

export const mealPlanShoppingListItems = sqliteTable('meal_plan_shopping_list', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull(),
  ingredientName: text('ingredient_name').notNull(),
  upc: text('upc'),
  quantity: real('quantity'),
  unit: text('unit'),
  department: text('department'),
  status: text('status').notNull().$type<ShoppingListItemStatus>(),
  estimatedCost: real('estimated_cost'),
  storeSuggestion: text('store_suggestion'),
  source: text('source').notNull().default('plan'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type MealPlanShoppingListItemRow = typeof mealPlanShoppingListItems.$inferSelect
export type InsertMealPlanShoppingListItemRow = typeof mealPlanShoppingListItems.$inferInsert
```

`source`: `plan` | `predictive` — predictive footer separate from plan lines (spec 36).

Indexes: `(plan_id, status)`, `(plan_id, department)`.
