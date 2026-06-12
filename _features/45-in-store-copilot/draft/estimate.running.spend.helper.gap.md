# Draft: estimate.running.spend.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/shop/estimate.running.spend.helper.ts`

**Gap:** No running spend total logic (G15).

**Source:** `build-guide/32-in-store-copilot/04-spend-estimate.md`, `brioela-specs/45-in-store-copilot.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/_db/brain.sqlite.types'

export type RunningSpendState = {
  spendEstimate: number
  pricedItemCount: number
  unpricedItemCount: number
  currency: string
}

export type ResolvedScanPrice = {
  productId: string
  amount: number | null
  source: 'personal_history' | 'community_sighting' | 'unpriced'
  currency: string
}

export async function resolveScanItemPrice(
  db: BrainSqlite,
  userId: string,
  placeId: string,
  productId: string,
): Promise<ResolvedScanPrice> {
  const personal = await db.query.purchasePriceEvent.findFirst({
    where: (row, { and, eq }) =>
      and(eq(row.userId, userId), eq(row.placeId, placeId), eq(row.productId, productId)),
    orderBy: (row, { desc }) => [desc(row.purchasedAt)],
  })

  if (personal?.unitPrice != null) {
    return {
      productId,
      amount: personal.unitPrice,
      source: 'personal_history',
      currency: personal.currency,
    }
  }

  const community = await fetchLatestCommunityPriceSighting(placeId, productId)
  if (community != null) {
    return {
      productId,
      amount: community.amount,
      source: 'community_sighting',
      currency: community.currency,
    }
  }

  return { productId, amount: null, source: 'unpriced', currency: 'USD' }
}

export function applyScanToRunningSpend(
  state: RunningSpendState,
  price: ResolvedScanPrice,
): RunningSpendState {
  if (price.amount == null) {
    return { ...state, unpricedItemCount: state.unpricedItemCount + 1 }
  }

  return {
    spendEstimate: state.spendEstimate + price.amount,
    pricedItemCount: state.pricedItemCount + 1,
    unpricedItemCount: state.unpricedItemCount,
    currency: price.currency,
  }
}

async function fetchLatestCommunityPriceSighting(
  placeId: string,
  productId: string,
): Promise<{ amount: number; currency: string } | null> {
  // **28** consumer — Supabase price_sighting read
  return null
}
```
