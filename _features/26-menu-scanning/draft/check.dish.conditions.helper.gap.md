# Gap snapshot: check.dish.conditions.helper.ts

Target: `backend/src/api/menu-scans/_helpers/check.dish.conditions.helper.ts`

**Status:** Not in repo. From `build-guide/22-medical-conditions/05-recipe-meal-map-cooking.md`.

```typescript
import type { ParsedMenuDish } from '@brioela/shared/validator/menu.scan'
import type { Env } from '@/types/env'

export type DishConditionFlag = {
  conditionType: string
  flagLevel: 'hard' | 'soft' | 'info'
  reason: string
  trigger: string
  matchedRuleIds: string[]
  confidence: number
}

export type DishConditionBatchResult = {
  byDishId: Record<string, DishConditionFlag[]>
  guardrailsUnavailable: boolean
}

export async function checkDishConditionsBatch(
  userId: string,
  dishes: ParsedMenuDish[],
  env: Env,
): Promise<DishConditionBatchResult> {
  const brainId = env.BRAIN.idFromName(userId)
  const brain = env.BRAIN.get(brainId)

  const response = await brain.fetch(
    new Request('https://internal/evaluate-dish-conditions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INTERNAL_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dishes }),
    }),
  )

  if (!response.ok) {
    console.error('Dish condition check failed:', response.status)
    return {
      byDishId: Object.fromEntries(dishes.map((d) => [d.id, []])),
      guardrailsUnavailable: true,
    }
  }

  return response.json() as Promise<DishConditionBatchResult>
}
```

**23** owns `evaluateDishConditionRules` in Brain DO. **26** orchestrates — same pattern as **24** product conditions.
