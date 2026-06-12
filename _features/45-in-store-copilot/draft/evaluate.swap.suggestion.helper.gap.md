# Draft: evaluate.swap.suggestion.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/shop/evaluate.swap.suggestion.helper.ts`

**Gap:** No personal swap evidence bar (G16).

**Source:** `build-guide/32-in-store-copilot/03-speech-rules-and-swaps.md`

---

```typescript
import type { Verdict } from '@brioela/shared/validator/scan'
import type { ShopContextPayload } from '@brioela/shared/validator/shop/shop.context.payload.schema'

export type SwapEvidenceKind = 'glucose' | 'price' | 'condition'

export type SwapSuggestion = {
  kind: SwapEvidenceKind
  scannedProductId: string
  alternativeProductId: string
  spokenSummary: string
  personalEvidenceNote: string
}

export type EvaluateSwapInput = {
  verdict: Verdict
  scannedProductId: string
  alternativeProductId: string
  context: ShopContextPayload
}

export function evaluateSwapSuggestion(input: EvaluateSwapInput): SwapSuggestion | null {
  const glucose = findGlucoseEvidence(
    input.context,
    input.scannedProductId,
    input.alternativeProductId,
  )
  if (glucose && isPlausiblyInStore(input.context, input.alternativeProductId)) {
    return glucose
  }

  const price = findPersonalPriceEvidence(
    input.context,
    input.scannedProductId,
    input.alternativeProductId,
  )
  if (price && isPlausiblyInStore(input.context, input.alternativeProductId)) {
    return price
  }

  const condition = findConfirmedConditionEvidence(input.verdict, input.alternativeProductId)
  if (condition && isPlausiblyInStore(input.context, input.alternativeProductId)) {
    return condition
  }

  return null
}

function isPlausiblyInStore(context: ShopContextPayload, productId: string): boolean {
  const inHistory = context.topRecurringPrices.some((row) => row.productId === productId)
  const inGround = context.groundFinds.some((find) => find.summary.includes(productId))
  return inHistory || inGround
}

function findGlucoseEvidence(
  context: ShopContextPayload,
  scannedId: string,
  alternativeId: string,
): SwapSuggestion | null {
  const trigger = context.glucoseSpikeTriggers.find(
    (row) => row.productId === scannedId || row.ingredientKey.length > 0,
  )
  if (!trigger) return null

  return {
    kind: 'glucose',
    scannedProductId: scannedId,
    alternativeProductId: alternativeId,
    spokenSummary: 'That one has spiked your glucose before — the alternative has stayed flatter for you.',
    personalEvidenceNote: trigger.note,
  }
}

function findPersonalPriceEvidence(
  context: ShopContextPayload,
  scannedId: string,
  alternativeId: string,
): SwapSuggestion | null {
  const alt = context.topRecurringPrices.find((row) => row.productId === alternativeId)
  const scanned = context.topRecurringPrices.find((row) => row.productId === scannedId)
  if (!alt || !scanned) return null
  if (alt.lastPaidAmount >= scanned.lastPaidAmount) return null

  return {
    kind: 'price',
    scannedProductId: scannedId,
    alternativeProductId: alternativeId,
    spokenSummary: 'Cheaper than your usual — good time to stock up.',
    personalEvidenceNote: `You usually pay ${scanned.lastPaidAmount}; this alternative is ${alt.lastPaidAmount}.`,
  }
}

function findConfirmedConditionEvidence(
  verdict: Verdict,
  alternativeId: string,
): SwapSuggestion | null {
  if (verdict.level === 'green') return null
  return {
    kind: 'condition',
    scannedProductId: verdict.productId,
    alternativeProductId: alternativeId,
    spokenSummary: 'This fits your confirmed condition rules better.',
    personalEvidenceNote: 'Confirmed personal condition rule — not population commentary.',
  }
}
```
