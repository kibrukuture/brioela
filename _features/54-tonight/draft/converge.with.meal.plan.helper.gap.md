# Draft: converge.with.meal.plan.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/converge.with.meal.plan.helper.ts`

**Gap (feature 54):** Strict meal-plan convergence + slot update on re-validation failure.

**Source:** `build-guide/38-tonight/01-answer-generation.md` § Convergence Rule

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import type { TonightContext } from '@/agents/brain/_helpers/tonight/assemble.tonight.context.helper'

export type ConvergeResult =
  | { mode: 'plan'; recipeId: string; slotId: string; adjusted: false }
  | { mode: 'plan'; recipeId: string; slotId: string; adjusted: true; previousRecipeId: string }
  | { mode: 'generate' }

export async function convergeWithMealPlan(
  db: BrainDatabase,
  ctx: TonightContext,
): Promise<ConvergeResult> {
  if (!ctx.planSlot) {
    return { mode: 'generate' }
  }

  const coverage = ctx.inventoryCoverageByRecipeId.get(ctx.planSlot.recipeId) ?? 0
  const meetsReadiness =
    ctx.readinessBias !== 'low' || coverage >= 0.85 /* low-effort threshold */

  if (coverage >= 1.0 && meetsReadiness) {
    return {
      mode: 'plan',
      recipeId: ctx.planSlot.recipeId,
      slotId: ctx.planSlot.slotId,
      adjusted: false,
    }
  }

  // Re-validation failed — rank best alternative and patch plan slot (**34** owner write)
  const replacement = await db.run(/* rankTonightRecipePool with plan bias */)

  if (!replacement) {
    return { mode: 'generate' }
  }

  await db.run(/* updateMealPlanSlot(slotId, replacement.recipeId) — **34** RPC */)

  return {
    mode: 'plan',
    recipeId: replacement.recipeId,
    slotId: ctx.planSlot.slotId,
    adjusted: true,
    previousRecipeId: ctx.planSlot.recipeId,
  }
}
```

**Rule:** Tonight never contradicts the plan with a competing suggestion — only restate or adjust the slot.
