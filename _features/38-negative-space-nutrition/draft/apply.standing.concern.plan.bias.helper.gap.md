# Draft: apply.standing.concern.plan.bias.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/apply.standing.concern.plan.bias.helper.ts`

**Gap (feature 34 consumer, 38 contract):** Meal plan quietly favors carrier recipes for `diet.gaps` watching entries.

**Source:** `brioela-specs/50-negative-space-nutrition.md`, `_features/34-pantry-meal-plan/spec.md`

---

```typescript
import type { DietGapMemoryValue } from '@shared/validator/negative-space/diet.gaps.memory.schema'
import type { NutrientCategoryKey } from '@/agents/brain/_helpers/negative-space/nutrient.category.catalog'

export type RecipePoolEntry = {
  recipeId: string
  categoryTags: NutrientCategoryKey[]
  baseScore: number
}

const STANDING_CONCERN_BIAS = 0.15

export function applyStandingConcernPlanBias(
  recipes: RecipePoolEntry[],
  dietGaps: Record<string, DietGapMemoryValue>,
): RecipePoolEntry[] {
  const watching = Object.entries(dietGaps)
    .filter(([, v]) => v.status === 'watching')
    .map(([k]) => k as NutrientCategoryKey)

  if (watching.length === 0) {
    return recipes
  }

  return recipes
    .map((r) => {
      const matches = r.categoryTags.some((t) => watching.includes(t))
      return {
        ...r,
        baseScore: matches ? r.baseScore + STANDING_CONCERN_BIAS : r.baseScore,
      }
    })
    .sort((a, b) => b.baseScore - a.baseScore)
}
```

**38 vs 34:** **38** writes `diet.gaps`; **34** reads and ranks — no gap detection in meal plan handler.

**37 boundary:** Plan bias is silent — no "filling your omega-3 gap" copy in plan UI unless user asked.
