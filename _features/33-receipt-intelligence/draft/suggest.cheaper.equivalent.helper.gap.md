# Draft: suggest.cheaper.equivalent.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/suggest.cheaper.equivalent.helper.ts`

**Source:** `brioela-specs/29-food-cost-inflation-tracker.md`

---

```typescript
import type { AppContext } from '@/index'
import { readUserConstraintProfile } from '@/agents/brain/_rpc/read.user.constraint.profile.rpc'
import { findSimilarProductsInCategory } from '@/api/scan/_helpers/find.similar.products.in.category.helper'

export type CheaperEquivalentSuggestion = {
  productId: string
  productName: string
  storeName: string
  placeId: string
  price: number
  pctCheaper: number
} | null

export async function suggestCheaperEquivalent(
  c: AppContext,
  input: {
    userId: string
    productId: string
    currentPrice: number
    geoHash: string | null
  },
): Promise<CheaperEquivalentSuggestion> {
  const constraints = await readUserConstraintProfile(c, input.userId)
  const candidates = await findSimilarProductsInCategory({
    productId: input.productId,
    constraints,
  })

  if (candidates.length === 0) return null

  const nearbyPrices = await c.env.INTERNAL_API.fetch(
    new Request(
      `http://internal/api/map/price-sightings/nearby?geo_hash=${input.geoHash ?? ''}`,
      { method: 'GET' },
    ),
  )
  if (!nearbyPrices.ok) return null

  const sightings = (await nearbyPrices.json()) as Array<{
    product_id: string
    amount: number
    place_id: string
    store_name: string
  }>

  for (const candidate of candidates) {
    const sighting = sightings
      .filter((s) => s.product_id === candidate.productId && s.amount < input.currentPrice)
      .sort((a, b) => a.amount - b.amount)[0]

    if (!sighting) continue

    const pctCheaper = (input.currentPrice - sighting.amount) / input.currentPrice
    return {
      productId: candidate.productId,
      productName: candidate.productName,
      storeName: sighting.store_name,
      placeId: sighting.place_id,
      price: sighting.amount,
      pctCheaper,
    }
  }

  return null
}
```

**Boundaries:**
- Constraint profile from **07** — allergen-containing cheaper product never surfaced.
- Nearby prices from **28** shared `price_sighting` — not private Brain history.
- Suggestion stored on `personal_price_alert.suggestion_product_id`.
