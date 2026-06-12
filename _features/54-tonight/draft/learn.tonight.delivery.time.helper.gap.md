# Draft: learn.tonight.delivery.time.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/learn.tonight.delivery.time.helper.ts`

**Gap (feature 54):** Learn delivery minute from cooking signals.

**Source:** `build-guide/38-tonight/02-timing-and-delivery.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'

const DEFAULT_DELIVERY_MINUTE = 17 * 60 // 5:00 PM local
const LEAD_MINUTES_MIN = 45
const LEAD_MINUTES_MAX = 90
const COLD_START_DAYS_MS = 14 * 24 * 60 * 60 * 1000

export type LearnDeliveryTimeResult = {
  deliveryMinute: number
  cookingMeal: 'breakfast' | 'lunch' | 'dinner'
  inColdStart: boolean
}

export async function learnTonightDeliveryTime(
  db: BrainDatabase,
  userId: string,
  now: number,
): Promise<LearnDeliveryTimeResult> {
  const pref = await db.run(/* select tonight_delivery_preference */)

  const coldStartEndsAt = pref?.coldStartEndsAt ?? now + COLD_START_DAYS_MS
  const inColdStart = now < coldStartEndsAt

  const decisionSignals = await db.run(/* cooking session starts, recipe opens, pantry scans */)

  if (!decisionSignals.length) {
    return {
      deliveryMinute: pref?.learnedDeliveryMinute ?? DEFAULT_DELIVERY_MINUTE,
      cookingMeal: pref?.cookingMeal ?? 'dinner',
      inColdStart,
    }
  }

  const medianDecisionMinute = decisionSignals.medianMinute
  const lead = Math.min(LEAD_MINUTES_MAX, Math.max(LEAD_MINUTES_MIN, decisionSignals.suggestedLead))
  const deliveryMinute = Math.max(0, medianDecisionMinute - lead)

  return {
    deliveryMinute,
    cookingMeal: decisionSignals.inferredMeal ?? 'dinner',
    inColdStart,
  }
}
```
