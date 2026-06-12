# Draft: write.purchase.price.events.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/write.purchase.price.events.helper.ts`

**Source:** `brioela-specs/29-food-cost-inflation-tracker.md`

---

```typescript
import { createId } from '@paralleldrive/cuid2'
import type { BrainDb } from '@/agents/brain/_types/brain.db'
import type { MatchedReceiptLine } from './match.receipt.line.items.helper'
import { purchasePriceEvents } from '@/agents/brain/_schemas/purchase.price.event.schema'

export async function writePurchasePriceEventsFromReceipt(input: {
  db: BrainDb
  userId: string
  receiptId: string
  merchantName: string | null
  placeId: string | null
  capturedAt: number
  currency: string
  lines: Array<MatchedReceiptLine & { lineItemId: string }>
}): Promise<string[]> {
  const eventIds: string[] = []

  for (const line of input.lines) {
    if (line.resolution !== 'matched_product' || !line.matchedProductId) continue
    const price = line.unitPrice ?? line.lineTotal
    if (price == null) continue

    const id = createId()
    await input.db.insert(purchasePriceEvents).values({
      id,
      userId: input.userId,
      upc: line.upc,
      productId: line.matchedProductId,
      productName: line.normalizedLabel ?? line.rawLabel,
      price,
      currency: input.currency,
      storeName: input.merchantName,
      storeLocation: null,
      placeId: input.placeId,
      purchaseDate: input.capturedAt,
      receiptId: input.receiptId,
      receiptLineItemId: line.lineItemId,
      createdAt: Date.now(),
    })

    eventIds.push(id)
  }

  return eventIds
}
```

**Boundary:** Private Brain SQLite only. Shared map prices → `write.price.sighting.from.receipt.helper.ts` (**28**).
