# Draft: push.scan.verdict.to.shop.session.helper.ts (gap — file does not exist)

Target: `backend/src/api/scan/_helpers/push.scan.verdict.to.shop.session.helper.ts`

**Gap:** No **24** → **45** mid-session verdict push (G21).

**Source:** `brioela-specs/45-in-store-copilot.md`, `build-guide/32-in-store-copilot/01-session-lifecycle.md`

**Called from:** `resolve.scan.handler.ts` after `buildVerdict`

---

```typescript
import type { Env } from '@/types/env'
import type { Verdict } from '@brioela/shared/validator/scan'
import { getBrainStub } from '@/agents/brain/get.brain.stub'
import { resolveScanItemPrice, applyScanToRunningSpend } from '@/agents/brain/_handlers/shop/estimate.running.spend.helper'
import { evaluateSwapSuggestion } from '@/agents/brain/_handlers/shop/evaluate.swap.suggestion.helper'
import { warnConstraintOnScan } from '@/agents/brain/_handlers/shop/warn.constraint.on.scan.helper'
import {
  decideInStoreSpeech,
  bumpInterventionCounter,
} from '@/agents/brain/_handlers/shop/enforce.in.store.speech.policy.helper'
import { appendShopVisitEvent } from '@/agents/brain/_handlers/shop/append.shop.visit.event.helper'

export type PushScanVerdictInput = {
  userId: string
  visitId: string
  placeId: string
  verdict: Verdict
  scanEventId: string
  alternativeProductId?: string
}

export async function pushScanVerdictToShopSession(
  env: Env,
  input: PushScanVerdictInput,
): Promise<void> {
  const brain = getBrainStub(env, input.userId)
  const activeVisit = await brain.getActiveShopVisit(input.userId)
  if (!activeVisit || activeVisit.visitId !== input.visitId) return

  const doName = `shop-${input.userId}-${input.visitId}`
  const miraId = env.MIRA_SESSION.idFromName(doName)
  const miraStub = env.MIRA_SESSION.get(miraId)

  const price = await resolveScanItemPrice(
    brain.db,
    input.userId,
    input.placeId,
    input.verdict.productId,
  )

  const situation = await brain.getInStoreCopilotSituation(input.visitId)
  const nextSpend = applyScanToRunningSpend(
    {
      spendEstimate: situation.runningSpendEstimate,
      pricedItemCount: situation.pricedItemCount,
      unpricedItemCount: 0,
      currency: price.currency,
    },
    price,
  )

  await appendShopVisitEvent(brain.db, {
    visitId: input.visitId,
    eventType: 'scan',
    payload: {
      scanEventId: input.scanEventId,
      productId: input.verdict.productId,
      verdictLevel: input.verdict.level,
      price,
      spend: nextSpend,
    },
  })

  const constraintWarning = await warnConstraintOnScan(input.verdict)
  if (constraintWarning) {
    const decision = decideInStoreSpeech(situation, 'constraint_warning')
    if (decision.speak) {
      await miraStub.fetch('https://mira/realtime-input', {
        method: 'POST',
        body: JSON.stringify({
          type: 'scan_result',
          verdict: input.verdict.level,
          speech: constraintWarning.spokenLine,
        }),
      })
    }
  }

  if (input.alternativeProductId) {
    const context = await brain.getShopContextPayload(input.visitId)
    const swap = evaluateSwapSuggestion({
      verdict: input.verdict,
      scannedProductId: input.verdict.productId,
      alternativeProductId: input.alternativeProductId,
      context,
    })
    if (swap) {
      const decision = decideInStoreSpeech(situation, 'swap_suggestion')
      if (decision.speak) {
        await miraStub.fetch('https://mira/realtime-input', {
          method: 'POST',
          body: JSON.stringify({ type: 'swap_suggestion', summary: swap.spokenSummary }),
        })
        await appendShopVisitEvent(brain.db, {
          visitId: input.visitId,
          eventType: 'swap_suggested',
          payload: swap,
        })
        await brain.saveInStoreCopilotSituation(
          bumpInterventionCounter(situation, 'swap_suggestion'),
        )
      }
    }
  }

  await miraStub.fetch('https://mira/realtime-input', {
    method: 'POST',
    body: JSON.stringify({
      type: 'running_total_update',
      spendEstimate: nextSpend.spendEstimate,
      pricedItemCount: nextSpend.pricedItemCount,
      unpricedItemCount: nextSpend.unpricedItemCount,
      framing: 'estimate',
    }),
  })

  await brain.saveInStoreCopilotSituation({
    ...situation,
    runningSpendEstimate: nextSpend.spendEstimate,
    pricedItemCount: nextSpend.pricedItemCount,
    lastScanEventId: input.scanEventId,
  })
}
```
