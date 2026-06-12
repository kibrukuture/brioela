# Draft: compute.spend.summary.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/compute.spend.summary.helper.ts`

**Source:** `build-guide/13-receipt-intelligence/04-spend-summaries.md`

---

```typescript
import { createId } from '@paralleldrive/cuid2'
import type { BrainDb } from '@/agents/brain/_types/brain.db'
import { spendSummaries } from '@/agents/brain/_schemas/spend.summary.schema'
import { getProductHealthSpendCategory } from '@/api/scan/_helpers/get.product.health.spend.category.helper'

export type WeekSpendBuckets = {
  healthySpend: number
  nonHealthySpend: number
  uncategorizedSpend: number
}

export async function computeSpendSummaryForWeek(input: {
  db: BrainDb
  userId: string
  weekStart: number
  receiptLines: Array<{
    matchedProductId: string | null
    resolution: string
    lineTotal: number | null
    unitPrice: number | null
    quantity: number | null
  }>
  currency: string
}): Promise<WeekSpendBuckets> {
  const buckets: WeekSpendBuckets = {
    healthySpend: 0,
    nonHealthySpend: 0,
    uncategorizedSpend: 0,
  }

  for (const line of input.receiptLines) {
    const amount = line.lineTotal ?? (line.unitPrice != null && line.quantity != null
      ? line.unitPrice * line.quantity
      : line.unitPrice)
    if (amount == null) continue

    if (line.resolution !== 'matched_product' || !line.matchedProductId) {
      buckets.uncategorizedSpend += amount
      continue
    }

    const category = await getProductHealthSpendCategory(line.matchedProductId)
    if (category === 'healthy') buckets.healthySpend += amount
    else if (category === 'non_healthy') buckets.nonHealthySpend += amount
    else buckets.uncategorizedSpend += amount
  }

  await input.db
    .insert(spendSummaries)
    .values({
      id: createId(),
      userId: input.userId,
      weekStart: input.weekStart,
      healthySpend: buckets.healthySpend,
      nonHealthySpend: buckets.nonHealthySpend,
      uncategorizedSpend: buckets.uncategorizedSpend,
      currency: input.currency,
      computedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: [spendSummaries.userId, spendSummaries.weekStart],
      set: {
        healthySpend: buckets.healthySpend,
        nonHealthySpend: buckets.nonHealthySpend,
        uncategorizedSpend: buckets.uncategorizedSpend,
        computedAt: Date.now(),
      },
    })

  return buckets
}
```

**Presentation** of weekly summary → **35** ambient / **21** notifications. **33** computes only.
