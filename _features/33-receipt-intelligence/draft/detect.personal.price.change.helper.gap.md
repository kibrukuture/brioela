# Draft: detect.personal.price.change.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/detect.personal.price.change.helper.ts`

**Source:** `brioela-specs/29-food-cost-inflation-tracker.md`

---

```typescript
import { createId } from '@paralleldrive/cuid2'
import type { BrainDb } from '@/agents/brain/_types/brain.db'
import {
  personalPriceAlerts,
  type PersonalPriceAlertType,
} from '@/agents/brain/_schemas/personal.price.alert.schema'

const INCREASE_THRESHOLD = 0.15
const DECREASE_THRESHOLD = 0.1
const MIN_PRICE_POINTS = 3
const ROLLING_WINDOW_MS = 90 * 24 * 60 * 60 * 1000

export type PriceChangeDetection = {
  alertType: PersonalPriceAlertType
  pctChange: number
  baselinePrice: number
  currentPrice: number
} | null

export function detectPersonalPriceChange(input: {
  historicalPrices: number[]
  currentPrice: number
}): PriceChangeDetection {
  if (input.historicalPrices.length < MIN_PRICE_POINTS) return null

  const baseline =
    input.historicalPrices.reduce((sum, p) => sum + p, 0) / input.historicalPrices.length
  if (baseline <= 0) return null

  const pctChange = (input.currentPrice - baseline) / baseline

  if (pctChange > INCREASE_THRESHOLD) {
    return {
      alertType: 'increase',
      pctChange,
      baselinePrice: baseline,
      currentPrice: input.currentPrice,
    }
  }

  if (pctChange < -DECREASE_THRESHOLD) {
    return {
      alertType: 'decrease',
      pctChange,
      baselinePrice: baseline,
      currentPrice: input.currentPrice,
    }
  }

  return null
}

export async function persistPersonalPriceAlert(
  db: BrainDb,
  input: {
    userId: string
    productId: string
    upc: string | null
    storeName: string | null
    placeId: string | null
    detection: PriceChangeDetection
    purchasePriceEventId: string
    suggestionProductId?: string | null
  },
): Promise<void> {
  if (!input.detection) return

  await db.insert(personalPriceAlerts).values({
    id: createId(),
    userId: input.userId,
    upc: input.upc,
    productId: input.productId,
    alertType: input.detection.alertType,
    pctChange: input.detection.pctChange,
    baselinePrice: input.detection.baselinePrice,
    currentPrice: input.detection.currentPrice,
    storeName: input.storeName,
    placeId: input.placeId,
    suggestionProductId: input.suggestionProductId ?? null,
    purchasePriceEventId: input.purchasePriceEventId,
    createdAt: Date.now(),
    dismissedAt: null,
  })
}

export { ROLLING_WINDOW_MS, MIN_PRICE_POINTS }
```

Store attribution: price change at Store A is separate from Store B (filter historical prices by store before `detectPersonalPriceChange`).
