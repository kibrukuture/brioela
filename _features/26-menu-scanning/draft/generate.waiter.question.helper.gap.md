# Gap snapshot: generate.waiter.question.helper.ts

Target: `backend/src/api/menu-scans/_helpers/generate.waiter.question.helper.ts`

**Status:** Not in repo. From `build-guide/17-menu-scanning/04-waiter-questions.md`.

```typescript
import type { ParsedMenuDish } from '@brioela/shared/validator/menu.scan'

type ConstraintMatchLite = {
  constraintType: string
  entityValue: string
  severity: 'hard' | 'soft'
}

type ConditionFlagLite = {
  conditionType: string
  flagLevel: 'hard' | 'soft' | 'info'
  reason: string
  trigger?: string
}

type DishConstraintEvaluation = {
  level: string
  matches: ConstraintMatchLite[]
  primaryReason: string | null
}

function pickPrimaryRisk(
  constraint: DishConstraintEvaluation,
  conditions: ConditionFlagLite[],
): { riskIngredient: string; questionType: 'contains' | 'shared_prep' | 'hidden_component' | 'cooking_method' } {
  const hardAllergy = constraint.matches.find((m) => m.constraintType === 'hard_allergy')
  if (hardAllergy) {
    const fried = constraint.primaryReason?.toLowerCase().includes('fry')
    return {
      riskIngredient: hardAllergy.entityValue,
      questionType: fried ? 'shared_prep' : 'contains',
    }
  }

  const hardCondition = conditions.find((c) => c.flagLevel === 'hard')
  if (hardCondition?.trigger) {
    return { riskIngredient: hardCondition.trigger, questionType: 'contains' }
  }

  if (constraint.primaryReason?.toLowerCase().includes('sauce')) {
    return { riskIngredient: 'the sauce or marinade', questionType: 'hidden_component' }
  }

  return { riskIngredient: 'this allergen or ingredient', questionType: 'contains' }
}

export function generateWaiterQuestion(
  dish: ParsedMenuDish,
  constraint: DishConstraintEvaluation,
  conditions: ConditionFlagLite[],
): string {
  const { riskIngredient, questionType } = pickPrimaryRisk(constraint, conditions)

  if (questionType === 'shared_prep') {
    return `I'm allergic to ${riskIngredient}. Is ${dish.name} prepared in contact with ${riskIngredient}, such as a shared fryer or wok?`
  }

  if (questionType === 'hidden_component') {
    return `Does ${dish.name} contain ${riskIngredient}?`
  }

  if (dish.cookingMethod?.toLowerCase().includes('fried')) {
    return `Does ${dish.name} contain ${riskIngredient}, or is it battered or fried in shared oil with ${riskIngredient}?`
  }

  return `I'm allergic to ${riskIngredient}. Does ${dish.name} contain ${riskIngredient}, or is it prepared in contact with ${riskIngredient}?`
}
```

**Medical boundary:** Ask about ingredients (e.g. grapefruit) — never "Will this interfere with my medication?"
