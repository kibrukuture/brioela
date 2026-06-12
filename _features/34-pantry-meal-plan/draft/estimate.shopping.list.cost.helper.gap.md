# Draft: estimate.shopping.list.cost.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/pantry/estimate.shopping.list.cost.helper.ts`

**Gap (feature 34):** Cost estimate from **33** personal price history; **28** shared fallback.

**Source:** `build-guide/14-pantry-meal-plan/04-shopping-list-and-cost.md`, `build-guide/13-receipt-intelligence/05-price-history-and-alerts.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/_types'

type EstimateShoppingListCostInput = {
  db: BrainSqlite
  userId: string
  planId: string
}

type CostEstimateResult = {
  totalEstimatedCost: number
  itemCosts: Array<{
    listItemId: string
    ingredientName: string
    estimatedCost: number | null
    priceSource: 'personal' | 'shared' | 'unknown'
  }>
}

export async function estimateShoppingListCost(
  input: EstimateShoppingListCostInput,
): Promise<CostEstimateResult> {
  const toBuyItems = await readToBuyListItems(input.db, input.planId)
  const itemCosts = []

  let total = 0
  for (const item of toBuyItems) {
    const personal = await readLatestPersonalPrice(input.db, input.userId, item)
    if (personal !== null) {
      itemCosts.push({
        listItemId: item.id,
        ingredientName: item.ingredientName,
        estimatedCost: personal,
        priceSource: 'personal' as const,
      })
      total += personal
      continue
    }

    const shared = await readSharedMapPrice(input.userId, item)
    if (shared !== null) {
      itemCosts.push({
        listItemId: item.id,
        ingredientName: item.ingredientName,
        estimatedCost: shared,
        priceSource: 'shared' as const,
      })
      total += shared
      continue
    }

    itemCosts.push({
      listItemId: item.id,
      ingredientName: item.ingredientName,
      estimatedCost: null,
      priceSource: 'unknown' as const,
    })
  }

  await writeListItemCosts(input.db, itemCosts)
  return { totalEstimatedCost: total, itemCosts }
}

async function readToBuyListItems(db: BrainSqlite, planId: string) {
  void db
  void planId
  return [] as Array<{ id: string; ingredientName: string; upc: string | null }>
}

async function readLatestPersonalPrice(
  db: BrainSqlite,
  userId: string,
  item: { upc: string | null; ingredientName: string },
): Promise<number | null> {
  // Query purchase_price_event (**33**) by upc or normalized name
  void db
  void userId
  void item
  return null
}

async function readSharedMapPrice(
  userId: string,
  item: { upc: string | null },
): Promise<number | null> {
  // Internal call to **28** price_sighting near user — only when personal absent
  void userId
  void item
  return null
}

async function writeListItemCosts(
  db: BrainSqlite,
  costs: CostEstimateResult['itemCosts'],
): Promise<void> {
  void db
  void costs
}
```

Blocked: **33** `purchase_price_event` (G10), **28** map (G11).
