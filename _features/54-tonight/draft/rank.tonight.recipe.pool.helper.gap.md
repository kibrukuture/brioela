# Draft: rank.tonight.recipe.pool.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/rank.tonight.recipe.pool.helper.ts`

**Gap (feature 54):** Recipe pool ranking with **34** order + variety guard.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § The Answer Selection step 5

---

```typescript
import type { TonightContext } from '@/agents/brain/_helpers/tonight/assemble.tonight.context.helper'

export type RankedTonightRecipe = {
  recipeId: string
  score: number
  tier: 'made_and_liked' | 'saved' | 'new_but_near'
}

const VARIETY_GUARD_DAYS = 3

export function rankTonightRecipePool(
  ctx: TonightContext,
  pool: Array<{ recipeId: string; tier: RankedTonightRecipe['tier']; cookedAt?: number }>,
  recentCookedRecipeIds: string[],
): RankedTonightRecipe[] {
  const recentSet = new Set(recentCookedRecipeIds.slice(0, VARIETY_GUARD_DAYS))

  return pool
    .filter((r) => ctx.constraintClearedRecipeIds.includes(r.recipeId))
    .filter((r) => !recentSet.has(r.recipeId))
    .map((r) => {
      const coverage = ctx.inventoryCoverageByRecipeId.get(r.recipeId) ?? 0
      const tierScore = r.tier === 'made_and_liked' ? 3 : r.tier === 'saved' ? 2 : 1
      const expiringBoost = ctx.expiringItemKeys.some((k) =>
        /* recipe uses expiring item */ false,
      )
        ? 0.5
        : 0
      const readinessBoost =
        ctx.readinessBias === 'low' && coverage >= 0.85 ? 0.3 : 0
      const cravingBoost = ctx.cravingAdjustActive ? -0.2 /* lighter bias */ : 0

      return {
        recipeId: r.recipeId,
        tier: r.tier,
        score: tierScore + coverage + expiringBoost + readinessBoost + cravingBoost,
      }
    })
    .sort((a, b) => b.score - a.score)
}
```

**Boundary:** Pool membership and tier labels come from **08**/**34** — do not fork pool query.
