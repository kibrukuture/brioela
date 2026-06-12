# Draft: match.receipt.line.items.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/match.receipt.line.items.helper.ts`

**Source:** `build-guide/13-receipt-intelligence/03-line-item-product-matching.md`, `07-scanner/02-product-resolution.md`

---

```typescript
import type { LineItemResolution } from '@/agents/brain/_schemas/receipt.line.item.schema'
import { resolveProductFromReceiptLine } from '@/api/scan/_helpers/resolve.product.from.receipt.line.helper'

const MATCH_CONFIDENCE_PRODUCT = 0.75
const MATCH_CONFIDENCE_CATEGORY = 0.5

export type MatchedReceiptLine = {
  rawLabel: string
  normalizedLabel: string | null
  quantity: number | null
  unitPrice: number | null
  lineTotal: number | null
  upc: string | null
  merchantSku: string | null
  matchedProductId: string | null
  matchedCategoryId: string | null
  matchConfidence: number | null
  resolution: LineItemResolution
}

export async function matchReceiptLineItems(input: {
  merchantNormalized: string | null
  lines: Array<{
    rawLabel: string
    normalizedLabel: string | null
    quantity: number | null
    unitPrice: number | null
    lineTotal: number | null
    upc: string | null
    merchantSku: string | null
  }>
}): Promise<MatchedReceiptLine[]> {
  const results: MatchedReceiptLine[] = []

  for (const line of input.lines) {
    const resolution = await resolveProductFromReceiptLine({
      merchantNormalized: input.merchantNormalized,
      upc: line.upc,
      merchantSku: line.merchantSku,
      label: line.normalizedLabel ?? line.rawLabel,
    })

    let matchResolution: LineItemResolution = 'unresolved'
    let matchedProductId: string | null = null
    let matchedCategoryId: string | null = null
    let matchConfidence: number | null = null

    if (resolution.kind === 'product' && resolution.confidence >= MATCH_CONFIDENCE_PRODUCT) {
      matchResolution = 'matched_product'
      matchedProductId = resolution.productId
      matchConfidence = resolution.confidence
    } else if (resolution.kind === 'category' && resolution.confidence >= MATCH_CONFIDENCE_CATEGORY) {
      matchResolution = 'matched_category'
      matchedCategoryId = resolution.categoryId
      matchConfidence = resolution.confidence
    }

    results.push({
      ...line,
      matchedProductId,
      matchedCategoryId,
      matchConfidence,
      resolution: matchResolution,
    })
  }

  return results
}
```

**Rule:** Never fabricate product matches. Low confidence stays `unresolved`.

**Dependency:** `resolve.product.from.receipt.line.helper.ts` — **24** product resolution (unshipped).
