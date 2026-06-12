# Draft: assemble.shop.session.context.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/shop/assemble.shop.session.context.helper.ts`

**Gap:** No shop-scoped Brain context assembly at session start (G8).

**Source:** `build-guide/32-in-store-copilot/02-context-payload.md`

**Blocked by:** **34** list, **33** prices, **27** finds, **41** Mesa, **36** glucose

---

```typescript
import type { BrainSqlite } from '@/agents/brain/_db/brain.sqlite.types'
import type { ShopContextPayload } from '@brioela/shared/validator/shop/shop.context.payload.schema'
import { loadActiveShoppingList } from '@/agents/brain/_handlers/pantry/load.active.shopping.list.helper'
import { loadStorePriceHistorySlice } from '@/agents/brain/_handlers/receipt/load.store.price.history.slice.helper'
import { loadGlucoseSpikeTriggers } from '@/agents/brain/_handlers/health/load.glucose.spike.triggers.helper'
import { loadStoreGroundFinds } from '@/agents/brain/_handlers/ground/load.store.ground.finds.helper'
import { loadOpenPredictiveNudges } from '@/agents/brain/_handlers/pantry/load.open.predictive.nudges.helper'
import { loadActiveMesaAudience } from '@/agents/brain/_handlers/mesa/load.active.mesa.audience.helper'
import { loadFoodRelevantConstraintSummary } from '@/agents/brain/_handlers/constraints/load.food.relevant.constraint.summary.helper'

export type AssembleShopSessionContextInput = {
  db: BrainSqlite
  userId: string
  visitId: string
  placeId: string
  placeLabel: string
  dictatedItems?: string[]
}

export async function assembleShopSessionContext(
  input: AssembleShopSessionContextInput,
): Promise<ShopContextPayload> {
  const [
    shoppingList,
    priceSlice,
    glucoseSpikeTriggers,
    groundFinds,
    openPantryNudges,
    mesaAudience,
    constraintSummary,
  ] = await Promise.all([
    loadActiveShoppingList(input.db, input.userId, input.dictatedItems),
    loadStorePriceHistorySlice(input.db, input.userId, input.placeId),
    loadGlucoseSpikeTriggers(input.db, input.userId),
    loadStoreGroundFinds(input.placeId, { maxAgeDays: 7, limit: 12 }),
    loadOpenPredictiveNudges(input.db, input.userId),
    loadActiveMesaAudience(input.db, input.userId),
    loadFoodRelevantConstraintSummary(input.db, input.userId),
  ])

  return {
    visitId: input.visitId,
    placeId: input.placeId,
    placeLabel: input.placeLabel,
    shoppingList,
    weeklySpendBaseline: priceSlice.weeklyBaseline,
    topRecurringPrices: priceSlice.topRecurring,
    glucoseSpikeTriggers,
    groundFinds,
    openPantryNudges,
    mesaAudience,
    constraintSummary,
  }
}
```
