# Gap snapshot: generate.alert.candidates.helper.ts

Target: `backend/src/api/map/_helpers/generate.alert.candidates.helper.ts`

**Status:** Not in repo. From `build-guide/10-map/05-price-alerts.md`, spec 15, `_features/21-platform-notifications/spec.md`.

```typescript
import { getDb } from '@/core/db'
import { priceSighting } from '@brioela/shared/drizzle/schema/price.sighting.schema'
import { alertCandidate } from '@brioela/shared/drizzle/schema/alert.candidate.schema'
import { deliveredAlert } from '@brioela/shared/drizzle/schema/delivered.alert.schema'
import { and, eq, gte, desc } from 'drizzle-orm'

const INCREASE_THRESHOLD = 0.15
const DECREASE_THRESHOLD = 0.10
const ROLLING_WINDOW_DAYS = 90
const MIN_PRICE_POINTS = 3

type GenerateInput = {
  userId?: string
  productId?: string
  placeId?: string
  scope: 'user' | 'nearby_batch'
  env: Env
}

type GenerateResult = {
  created: number
  suppressed: number
  queuedForPush: number
}

export async function generateAlertCandidates(
  input: GenerateInput,
): Promise<GenerateResult> {
  if (!input.userId || !input.productId || !input.placeId) {
    return { created: 0, suppressed: 0, queuedForPush: 0 }
  }

  const db = getDb(input.env)
  const windowStart = new Date(Date.now() - ROLLING_WINDOW_DAYS * 86400000)

  const history = await db
    .select()
    .from(priceSighting)
    .where(
      and(
        eq(priceSighting.productId, input.productId),
        eq(priceSighting.placeId, input.placeId),
        gte(priceSighting.seenAt, windowStart),
      ),
    )
    .orderBy(desc(priceSighting.seenAt))

  if (history.length < MIN_PRICE_POINTS) {
    return { created: 0, suppressed: 0, queuedForPush: 0 }
  }

  const latest = history[0]
  const average =
    history.reduce((sum, row) => sum + row.amount, 0) / history.length
  const pctChange = (latest.amount - average) / average

  const hasInterest = await userHasProductInterest(input.userId, input.productId, input.env)
  if (!hasInterest) {
    return { created: 0, suppressed: 1, queuedForPush: 0 }
  }

  const recentlyDelivered = await wasRecentlyDelivered(
    input.userId,
    'price_alert',
    input.productId,
    input.env,
  )
  if (recentlyDelivered) {
    return { created: 0, suppressed: 1, queuedForPush: 0 }
  }

  let alertType: 'price_increase' | 'price_decrease' | null = null
  if (pctChange > INCREASE_THRESHOLD) alertType = 'price_increase'
  if (pctChange < -DECREASE_THRESHOLD) alertType = 'price_decrease'
  if (!alertType) {
    return { created: 0, suppressed: 0, queuedForPush: 0 }
  }

  const score = Math.min(1, Math.abs(pctChange))

  await db.insert(alertCandidate).values({
    userId: input.userId,
    productId: input.productId,
    placeId: input.placeId,
    alertType,
    score,
    pctChange,
    status: 'pending',
  })

  return { created: 1, suppressed: 0, queuedForPush: 1 }
}

async function userHasProductInterest(
  _userId: string,
  _productId: string,
  _env: Env,
): Promise<boolean> {
  // Brain purchase/scan history — stub
  return true
}

async function wasRecentlyDelivered(
  userId: string,
  alertType: string,
  objectId: string,
  env: Env,
): Promise<boolean> {
  const db = getDb(env)
  const dayAgo = new Date(Date.now() - 86400000)
  const rows = await db
    .select()
    .from(deliveredAlert)
    .where(
      and(
        eq(deliveredAlert.userId, userId),
        eq(deliveredAlert.alertType, alertType),
        eq(deliveredAlert.objectId, objectId),
        gte(deliveredAlert.deliveredAt, dayAgo),
      ),
    )
    .limit(1)
  return rows.length > 0
}
```

**Push kind:** `price_alert` — **21** delivers; **28** only creates candidates.
