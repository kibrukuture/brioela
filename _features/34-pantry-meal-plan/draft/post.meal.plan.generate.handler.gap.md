# Draft: post.meal.plan.generate.handler.ts (gap — file does not exist)

Target: `backend/src/api/pantry/_handlers/post.meal.plan.generate.handler.ts`

**Gap (feature 34):** `POST /api/meal-plans/generate`

---

```typescript
import type { Context } from 'hono'
import { GenerateMealPlanRequestSchema } from '@shared/validator/pantry/meal.plan.schema'
import { generateMealPlan } from '@/agents/brain/_handlers/pantry/generate.meal.plan.handler'
import { checkMealPlanEntitlement } from '@/agents/brain/_helpers/check.meal.plan.entitlement.helper'
import { getBrainDbForUser } from '@/agents/brain/_helpers/get.brain.db.for.user.helper'

export async function postMealPlanGenerateHandler(c: Context) {
  const userId = c.get('userId') as string
  const body = GenerateMealPlanRequestSchema.parse(await c.req.json())

  const { previewDays } = await checkMealPlanEntitlement(userId, body.previewDays)

  const db = await getBrainDbForUser(userId)
  const result = await generateMealPlan({
    db,
    userId,
    weekStartDate: body.weekStartDate,
    preferExistingInventory: body.preferExistingInventory,
    previewDays,
  })

  return c.json({ planId: result.planId, previewDays })
}
```

Tier conflict: spec 33 Core+ vs build guide Luma+ — resolve in `checkMealPlanEntitlement`.
