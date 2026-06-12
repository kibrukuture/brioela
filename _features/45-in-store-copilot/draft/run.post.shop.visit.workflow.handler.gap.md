# Draft: run.post.shop.visit.workflow.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/shop/run.post.shop.visit.workflow.handler.ts`

**Gap:** No Upstash post-visit workflow (G26).

**Source:** `build-guide/32-in-store-copilot/01-session-lifecycle.md`

---

```typescript
import type { Env } from '@/types/env'
import { reconcileShopListWithReceipt } from './reconcile.shop.list.with.receipt.helper'
import { emitDislikeSignalsFromSkipped } from './emit.dislike.signals.from.skipped.helper'
import { linkShopVisitReceipt } from './link.shop.visit.receipt.helper'
import { getBrainStub } from '@/agents/brain/get.brain.stub'

export type PostShopVisitWorkflowInput = {
  userId: string
  visitId: string
  receiptId?: string
}

export async function runPostShopVisitWorkflow(
  env: Env,
  input: PostShopVisitWorkflowInput,
): Promise<void> {
  const brain = getBrainStub(env, input.userId)
  const visit = await brain.getShopVisit(input.visitId)
  if (!visit) return

  const reconciliation = await reconcileShopListWithReceipt(brain.db, {
    visitId: input.visitId,
    receiptId: input.receiptId,
  })

  await emitDislikeSignalsFromSkipped(brain, reconciliation.skippedItemKeys)

  if (input.receiptId) {
    await linkShopVisitReceipt(brain.db, {
      visitId: input.visitId,
      receiptId: input.receiptId,
    })
  }

  // **33** purchase_price_event retraining runs in receipt ingest — not duplicated here
  // **34** pantry resets consume reconciliation.boughtItemKeys
  await brain.applyPantryResetsFromShopVisit({
    visitId: input.visitId,
    boughtItemKeys: reconciliation.boughtItemKeys,
  })

  await brain.finalizeShopVisit(input.visitId, {
    itemsBoughtEstimate: reconciliation.boughtItemKeys.length,
    spendEstimate: reconciliation.receiptTotal ?? visit.spendEstimate,
  })
}
```
