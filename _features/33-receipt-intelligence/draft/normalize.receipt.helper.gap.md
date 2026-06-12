# Draft: normalize.receipt.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/normalize.receipt.helper.ts`

**Source:** `build-guide/13-receipt-intelligence/02-gpt4o-mini-vision-and-normalization.md`

---

```typescript
import type { ReceiptVisionExtraction } from '@brioela/shared/validator/receipt/receipt.vision.schema'

export type NormalizedReceipt = {
  merchantName: string | null
  merchantNormalized: string | null
  capturedAt: number
  subtotal: number | null
  tax: number | null
  total: number
  currency: string
  lines: Array<{
    rawLabel: string
    normalizedLabel: string | null
    quantity: number | null
    unitPrice: number | null
    lineTotal: number | null
    upc: string | null
    merchantSku: string | null
  }>
}

export function normalizeReceiptFromVision(
  extraction: ReceiptVisionExtraction,
  fallbackCapturedAt: number,
): NormalizedReceipt {
  const merchantName = extraction.merchant_candidate?.trim() ?? null
  const merchantNormalized = merchantName
    ? merchantName.replace(/\s+/g, ' ').toUpperCase()
    : null

  const capturedAt = extraction.datetime_candidate
    ? Date.parse(extraction.datetime_candidate) || fallbackCapturedAt
    : fallbackCapturedAt

  const currency = (extraction.currency_candidate ?? 'USD').toUpperCase()
  const total = extraction.total ?? 0

  const lines = extraction.line_items.map((line) => ({
    rawLabel: line.raw_label,
    normalizedLabel: line.raw_label.trim().toLowerCase() || null,
    quantity: line.quantity,
    unitPrice: line.unit_price,
    lineTotal: line.line_total,
    upc: line.upc,
    merchantSku: line.merchant_sku,
  }))

  return {
    merchantName,
    merchantNormalized,
    capturedAt,
    subtotal: extraction.subtotal,
    tax: extraction.tax,
    total,
    currency,
    lines,
  }
}
```

Merchant → `map_place` linking is a separate helper (`link.merchant.to.place.helper.ts`) when confidence is high.
