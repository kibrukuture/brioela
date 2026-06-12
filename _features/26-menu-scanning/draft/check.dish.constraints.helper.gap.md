# Gap snapshot: check.dish.constraints.helper.ts

Target: `backend/src/api/menu-scans/_helpers/check.dish.constraints.helper.ts`

**Status:** Not in repo. Pattern from `build-guide/07-scanner/03-constraint-check.md` — dish text input.

```typescript
import type { ParsedMenuDish } from '@brioela/shared/validator/menu.scan'
import type { Env } from '@/types/env'

export type DishConstraintMatch = {
  constraintType: string
  entityValue: string
  severity: 'hard' | 'soft'
}

export type DishConstraintEvaluation = {
  level: 'block' | 'warn' | 'deprioritize' | 'clear' | 'guardrails_unavailable'
  matches: DishConstraintMatch[]
  primaryReason: string | null
}

export type DishConstraintBatchResult = {
  byDishId: Record<string, DishConstraintEvaluation>
  guardrailsUnavailable: boolean
}

export async function checkDishConstraintsBatch(
  userId: string,
  dishes: ParsedMenuDish[],
  env: Env,
): Promise<DishConstraintBatchResult> {
  const brainId = env.BRAIN.idFromName(userId)
  const brain = env.BRAIN.get(brainId)

  const response = await brain.fetch(
    new Request('https://internal/evaluate-dish-constraints', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INTERNAL_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dishes }),
    }),
  )

  if (!response.ok) {
    console.error('Dish constraint check failed:', response.status)
    const fallback: DishConstraintEvaluation = {
      level: 'guardrails_unavailable',
      matches: [],
      primaryReason: 'Personal food checks unavailable.',
    }
    return {
      byDishId: Object.fromEntries(dishes.map((d) => [d.id, fallback])),
      guardrailsUnavailable: true,
    }
  }

  return response.json() as Promise<DishConstraintBatchResult>
}
```

**Owner:** **07** implements matching in `tools/menu-scan/check-dish-constraint.ts`; **26** owns RPC wrapper.
