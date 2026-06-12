# Draft: get.active.meal.plan.handler.ts (gap — file does not exist)

Target: `backend/src/api/pantry/_handlers/get.active.meal.plan.handler.ts`

**Gap (feature 34):** `GET /api/meal-plans/active` — plan + slots + shopping list.

---

```typescript
import type { Context } from 'hono'
import { ActiveMealPlanResponseSchema } from '@shared/validator/pantry/meal.plan.schema'
import { readActiveMealPlan } from '@/agents/brain/_repositories/read.meal.plan.repository'

export async function getActiveMealPlanHandler(c: Context) {
  const userId = c.get('userId') as string
  const plan = await readActiveMealPlan(userId)

  if (plan === null) {
    return c.json({ plan: null }, 200)
  }

  const response = ActiveMealPlanResponseSchema.parse({
    planId: plan.id,
    weekStartDate: plan.weekStartDate,
    status: plan.status,
    slots: plan.slots,
    shoppingList: plan.shoppingList,
    estimatedTotalCost: plan.estimatedTotalCost,
    budgetBaseline: plan.budgetBaseline,
  })

  return c.json(response)
}
```
