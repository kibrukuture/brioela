# Draft: assemble.tonight.context.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/assemble.tonight.context.helper.ts`

**Gap (feature 54):** Orchestrate the six inputs before generation.

**Source:** `build-guide/38-tonight/01-answer-generation.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import type { TonightReasoningTag } from '@brioela/shared/constants/tonight'
import { resolveMesaAudience } from '@/agents/brain/_helpers/tonight/resolve.mesa.audience.helper'
import { readReadinessBias } from '@/agents/brain/_helpers/tonight/read.readiness.bias.helper'
import { resolveTimeBudget } from '@/agents/brain/_helpers/tonight/resolve.time.budget.helper'
import { loadActivePlanSlot } from '@/agents/brain/_helpers/tonight/load.active.plan.slot.helper'

export type TonightContext = {
  dateLocal: string
  audienceMemberIds: string[]
  constraintClearedRecipeIds: string[]
  inventoryCoverageByRecipeId: Map<string, number>
  expiringItemKeys: string[]
  timeBudgetMinutes: number
  readinessBias: 'low' | 'normal' | 'high_activity'
  planSlot: { recipeId: string; slotId: string } | null
  cravingAdjustActive: boolean
  reasoningTags: TonightReasoningTag[]
}

export type AssembleTonightContextInput = {
  userId: string
  dateLocal: string
  timezone: string
}

export async function assembleTonightContext(
  db: BrainDatabase,
  input: AssembleTonightContextInput,
): Promise<TonightContext> {
  const audience = await resolveMesaAudience(db, input.userId, input.dateLocal)
  const readiness = await readReadinessBias(db, input.userId)
  const timeBudget = await resolveTimeBudget(db, input.userId, input.dateLocal, input.timezone)
  const planSlot = await loadActivePlanSlot(db, input.userId, input.dateLocal)

  // Inventory read delegates to **34** assembleInventorySnapshot — not duplicated here
  const inventory = await db.run(/* pantry consumer RPC */)

  const reasoningTags: TonightReasoningTag[] = []
  if (planSlot) reasoningTags.push('plan_slot')
  if (readiness.bias === 'low') reasoningTags.push('low_readiness')
  if (audience.isMesaActive) reasoningTags.push('mesa_audience')
  if (timeBudget.isTight) reasoningTags.push('time_budget')
  if (inventory.expiringItemKeys.length > 0) reasoningTags.push('expiring_item')

  return {
    dateLocal: input.dateLocal,
    audienceMemberIds: audience.memberIds,
    constraintClearedRecipeIds: inventory.constraintClearedRecipeIds,
    inventoryCoverageByRecipeId: inventory.coverageByRecipeId,
    expiringItemKeys: inventory.expiringItemKeys,
    timeBudgetMinutes: timeBudget.minutes,
    readinessBias: readiness.bias,
    planSlot,
    cravingAdjustActive: inventory.cravingAdjustActive,
    reasoningTags,
  }
}
```

**Boundary:** Inventory snapshot assembly owned by **34** — this helper calls, never forks.
