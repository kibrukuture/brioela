# Draft: run.receipt.weekly.alarm.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/receipt/run.receipt.weekly.alarm.handler.ts`

**Source:** `brioela-specs/29-food-cost-inflation-tracker.md`, `build-guide/13-receipt-intelligence/04-spend-summaries.md`

**Dispatch:** **14** `dispatch.alarm.handler.ts` calls this on `alarm_type = 'receipt_weekly'` (or maintenance slot).

---

```typescript
import type { BrainDb } from '@/agents/brain/_types/brain.db'
import type { AppContext } from '@/index'
import { computeSpendSummaryForWeek } from './compute.spend.summary.helper'
import {
  detectPersonalPriceChange,
  persistPersonalPriceAlert,
  ROLLING_WINDOW_MS,
} from './detect.personal.price.change.helper'
import { suggestCheaperEquivalent } from './suggest.cheaper.equivalent.helper'
import { readReceiptLinesForWeek } from '@/agents/brain/_repositories/read.receipt.lines.for.week.repository'
import { readPurchasePriceHistory } from '@/agents/brain/_repositories/read.purchase.price.history.repository'

function startOfWeekMs(now: number): number {
  const d = new Date(now)
  const day = d.getUTCDay()
  const diff = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  d.setUTCHours(0, 0, 0, 0)
  return d.getTime()
}

export async function runReceiptWeeklyAlarm(input: {
  c: AppContext
  db: BrainDb
  userId: string
}): Promise<void> {
  const weekStart = startOfWeekMs(Date.now())
  const lines = await readReceiptLinesForWeek(input.db, input.userId, weekStart)

  await computeSpendSummaryForWeek({
    db: input.db,
    userId: input.userId,
    weekStart,
    receiptLines: lines,
    currency: 'USD',
  })

  const recentEvents = await readPurchasePriceHistory(input.db, {
    userId: input.userId,
    since: Date.now() - 7 * 24 * 60 * 60 * 1000,
  })

  for (const event of recentEvents) {
    const history = await readPurchasePriceHistory(input.db, {
      userId: input.userId,
      productId: event.productId,
      storeName: event.storeName,
      since: Date.now() - ROLLING_WINDOW_MS,
      excludeEventId: event.id,
    })

    const detection = detectPersonalPriceChange({
      historicalPrices: history.map((h) => h.price),
      currentPrice: event.price,
    })

    let suggestionProductId: string | null = null
    if (detection?.alertType === 'increase') {
      const suggestion = await suggestCheaperEquivalent(input.c, {
        userId: input.userId,
        productId: event.productId!,
        currentPrice: event.price,
        geoHash: null,
      })
      suggestionProductId = suggestion?.productId ?? null
    }

    await persistPersonalPriceAlert(input.db, {
      userId: input.userId,
      productId: event.productId!,
      upc: event.upc,
      storeName: event.storeName,
      placeId: event.placeId,
      detection,
      purchasePriceEventId: event.id,
      suggestionProductId,
    })
  }
}
```

**Rule:** Price computation runs weekly — not on every receipt scan (spec 29).
