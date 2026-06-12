# Draft: run.tonight.generation.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/tonight/run.tonight.generation.handler.ts`

**Gap (feature 54):** Full generation pipeline entry.

**Source:** `build-guide/38-tonight/00-overview.md`, `01-answer-generation.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { checkTonightTierGate } from '@/agents/brain/_helpers/tonight/check.tonight.tier.gate.helper'
import { assembleTonightContext } from '@/agents/brain/_helpers/tonight/assemble.tonight.context.helper'
import { convergeWithMealPlan } from '@/agents/brain/_helpers/tonight/converge.with.meal.plan.helper'
import { rankTonightRecipePool } from '@/agents/brain/_helpers/tonight/rank.tonight.recipe.pool.helper'
import { generateTonightSwaps } from '@/agents/brain/_helpers/tonight/generate.tonight.swaps.helper'
import { evaluateSingleItemPickup } from '@/agents/brain/_helpers/tonight/evaluate.single.item.pickup.helper'
import { decideTonightSilence } from '@/agents/brain/_policies/tonight/tonight.silence.policy'
import { generateTonightAnswer } from '@/agents/brain/_handlers/tonight/generate.tonight.answer.handler'
import { composeTonightCardDocument } from '@/agents/brain/_handlers/tonight/compose.tonight.card.document.handler'
import { storeTonightAnswer } from '@/agents/brain/_handlers/tonight/store.tonight.answer.handler'

export type RunTonightGenerationResult =
  | { generated: true; answerId: string }
  | { generated: false; reason: string }

export async function runTonightGeneration(
  db: BrainDatabase,
  userId: string,
  dateLocal: string,
  timezone: string,
  entitlement: Parameters<typeof checkTonightTierGate>[0],
): Promise<RunTonightGenerationResult> {
  const gate = checkTonightTierGate(entitlement)
  if (!gate.allowed) {
    return { generated: false, reason: 'tier_blocked' }
  }

  const ctx = await assembleTonightContext(db, { userId, dateLocal, timezone })
  const convergence = await convergeWithMealPlan(db, ctx)

  let primaryRecipeId: string
  let skipLlm = false

  if (convergence.mode === 'plan') {
    primaryRecipeId = convergence.recipeId
    skipLlm = !convergence.adjusted
  } else {
    const pool = await db.run(/* loadRecipePool **34** */)
    const ranked = rankTonightRecipePool(ctx, pool, [])
    if (!ranked.length) {
      return { generated: false, reason: 'empty_pool' }
    }
    primaryRecipeId = ranked[0].recipeId
  }

  const pickup = evaluateSingleItemPickup({ recipeId: primaryRecipeId, missingItemKeys: [] })
  const swaps = generateTonightSwaps(primaryRecipeId, [])
  const silence = decideTonightSilence({
    primaryRecipeId,
    swaps,
    pickup,
    poolSize: 1,
  })
  if (!silence.shouldGenerate) {
    return { generated: false, reason: silence.reason }
  }

  const copy = await generateTonightAnswer({
    ctx,
    recipeId: primaryRecipeId,
    recipeTitle: '/* load */',
    minutes: 35,
    inventoryClaim: pickup.mode === 'single_pickup' ? 'single_pickup' : 'full',
    pickupLabel: pickup.mode === 'single_pickup' ? pickup.pickup.itemLabel : undefined,
    skipLlm,
  })

  const document = await composeTonightCardDocument({
    headline: copy.headline,
    subline: copy.subline,
    recipeId: primaryRecipeId,
    swapRecipeIds: swaps!,
    reasoningTags: ctx.reasoningTags,
    minutes: 35,
  })

  const stored = await storeTonightAnswer(db, {
    userId,
    dateLocal,
    recipeId: primaryRecipeId,
    swapRecipeIds: swaps!,
    reasoningTags: ctx.reasoningTags,
    headline: copy.headline,
    subline: copy.subline,
    document,
    generatedAt: Date.now(),
  })

  return { generated: true, answerId: stored.answerId }
}
```
