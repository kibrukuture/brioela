# Draft: meal.plan.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/meal.plan.schema.ts`

**Gap (feature 34):** Active weekly meal plan header — Brain DO private data (spec 33).

**Source:** `brioela-specs/33-minimum-spend-meal-plan.md`, `build-guide/14-pantry-meal-plan/03-meal-plan-generation.md`

---

```typescript
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const mealPlanStatusValues = ['active', 'completed', 'abandoned'] as const
export type MealPlanStatus = (typeof mealPlanStatusValues)[number]

export const mealPlans = sqliteTable('meal_plan', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  weekStartDate: text('week_start_date').notNull(),
  status: text('status').notNull().$type<MealPlanStatus>(),
  estimatedTotalCost: real('estimated_total_cost'),
  budgetBaseline: real('budget_baseline'),
  generatedAt: integer('generated_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

export type MealPlanRow = typeof mealPlans.$inferSelect
export type InsertMealPlanRow = typeof mealPlans.$inferInsert
```

Indexes: `(user_id, status)`, partial `(user_id) WHERE status = 'active'`.
