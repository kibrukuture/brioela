# Gap snapshot: evaluate.dish.verdicts.helper.ts

Target: `backend/src/api/menu-scans/_helpers/evaluate.dish.verdicts.helper.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/03-dish-verdicts.md`, `04-waiter-questions.md`.

```typescript
import type { ParsedMenuDish, MenuDishVerdict } from '@brioela/shared/validator/menu.scan'
import type { Env } from '@/types/env'
import { checkDishConstraintsBatch } from './check.dish.constraints.helper'
import { checkDishConditionsBatch } from './check.dish.conditions.helper'
import { generateWaiterQuestion } from './generate.waiter.question.helper'

type DishEvaluationResult = {
  dishes: MenuDishVerdict[]
  greenCount: number
  yellowCount: number
  redCount: number
  guardrailsUnavailable: boolean
}

function hasSparseDetail(dish: ParsedMenuDish): boolean {
  return dish.listedIngredients.length === 0 && !dish.description
}

function assignVerdict(
  dish: ParsedMenuDish,
  constraintLevel: 'block' | 'warn' | 'deprioritize' | 'clear' | 'guardrails_unavailable',
  hasHardConditionFlag: boolean,
  extractionConfidence: number,
): 'green' | 'yellow' | 'red' {
  if (constraintLevel === 'block' || hasHardConditionFlag) return 'red'
  if (constraintLevel === 'guardrails_unavailable') return 'yellow'
  if (hasSparseDetail(dish)) return 'yellow'
  if (extractionConfidence < 0.65) return 'yellow'
  if (constraintLevel === 'warn') return 'yellow'
  if (constraintLevel === 'deprioritize') return 'green'
  return 'green'
}

function rankDishes(dishes: MenuDishVerdict[]): MenuDishVerdict[] {
  const order = { green: 0, yellow: 1, red: 2 } as const
  return [...dishes].sort((a, b) => {
    const byVerdict = order[a.verdict] - order[b.verdict]
    if (byVerdict !== 0) return byVerdict
    return b.confidence - a.confidence
  })
}

export async function evaluateDishVerdicts(
  userId: string,
  dishes: ParsedMenuDish[],
  env: Env,
): Promise<DishEvaluationResult> {
  const constraintResults = await checkDishConstraintsBatch(userId, dishes, env)
  const conditionResults = await checkDishConditionsBatch(userId, dishes, env)

  const guardrailsUnavailable =
    constraintResults.guardrailsUnavailable || conditionResults.guardrailsUnavailable

  const evaluated: MenuDishVerdict[] = dishes.map((dish) => {
    const constraint = constraintResults.byDishId[dish.id]
    const conditions = conditionResults.byDishId[dish.id] ?? []
    const hasHardConditionFlag = conditions.some((f) => f.flagLevel === 'hard')

    const verdict = assignVerdict(
      dish,
      constraint.level,
      hasHardConditionFlag,
      dish.extractionConfidence,
    )

    const reason =
      verdict === 'red'
        ? constraint.primaryReason ?? conditions.find((c) => c.flagLevel === 'hard')?.reason ?? 'Visible conflict found.'
        : verdict === 'yellow'
          ? constraint.primaryReason ?? 'Ingredient detail is missing or uncertain.'
          : 'No visible conflict found.'

    const waiterQuestion =
      verdict === 'yellow'
        ? generateWaiterQuestion(dish, constraint, conditions)
        : null

    return {
      dishId: dish.id,
      dishName: dish.name,
      verdict,
      reason,
      matchedConstraints: constraint.matches,
      conditionFlags: conditions.map((c) => ({
        conditionType: c.conditionType,
        flagLevel: c.flagLevel,
        reason: c.reason,
      })),
      waiterQuestion,
      confidence: dish.extractionConfidence,
    }
  })

  const ranked = rankDishes(evaluated)

  return {
    dishes: ranked,
    greenCount: ranked.filter((d) => d.verdict === 'green').length,
    yellowCount: ranked.filter((d) => d.verdict === 'yellow').length,
    redCount: ranked.filter((d) => d.verdict === 'red').length,
    guardrailsUnavailable,
  }
}
```

**Safety:** Unknown = yellow. Red requires visible evidence from constraint/condition match.
