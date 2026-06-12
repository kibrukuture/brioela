# Draft: write.price.sighting.from.receipt.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/write.price.sighting.from.receipt.helper.ts`

**Boundary (critical):** Emits **anonymized** shared `price_sighting` rows for **28**. Never writes personal receipt history to Supabase.

**Source:** `build-guide/13-receipt-intelligence/05-price-history-and-alerts.md`, `build-guide/10-map/05-price-alerts.md`

---

```typescript
import type { AppContext } from '@/index'
import type { MatchedReceiptLine } from './match.receipt.line.items.helper'

const MIN_MATCH_CONFIDENCE_FOR_SIGHTING = 0.85

export async function writePriceSightingFromReceipt(
  c: AppContext,
  input: {
    userId: string
    placeId: string
    currency: string
    capturedAt: number
    lines: MatchedReceiptLine[]
  },
): Promise<void> {
  for (const line of input.lines) {
    if (line.resolution !== 'matched_product' || !line.matchedProductId) continue
    if ((line.matchConfidence ?? 0) < MIN_MATCH_CONFIDENCE_FOR_SIGHTING) continue
    const amount = line.unitPrice ?? line.lineTotal
    if (amount == null) continue

    await c.env.INTERNAL_API.fetch(new Request('http://internal/api/map/price-sightings', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-user-id': input.userId,
      },
      body: JSON.stringify({
        product_id: line.matchedProductId,
        place_id: input.placeId,
        amount,
        currency: input.currency,
        seen_at: new Date(input.capturedAt).toISOString(),
        source: 'receipt',
      }),
    }))
  }
}
```

**Requires:** **28** `POST /api/map/price-sightings` + `map_place` resolution from merchant link.
**Reporter user ID** stored internal-only per **28** privacy model — never shown on public map.
