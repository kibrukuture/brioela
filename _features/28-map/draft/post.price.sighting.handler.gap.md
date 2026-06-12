# Gap snapshot: post.price.sighting.handler.ts

Target: `backend/src/api/map/_handlers/post.price.sighting.handler.ts`

**Status:** Not in repo. From `build-guide/10-map/05-price-alerts.md`, spec 15.

```typescript
import type { AppContext } from '@/index'
import { HTTPException } from 'hono/http-exception'
import { ErrorCode } from '@brioela/shared/types/api'
import {
  CreatePriceSightingRequestSchema,
  PriceSightingSchema,
} from '@brioela/shared/validator/map.schema'
import { getDb } from '@/core/db'
import { priceSighting } from '@brioela/shared/drizzle/schema/price.sighting.schema'
import { enqueuePriceAlertEvaluation } from '../_helpers/enqueue.price.alert.helper'

export async function postPriceSighting(c: AppContext) {
  const userId = c.get('userId')
  const body = await c.req.json()
  const parsed = CreatePriceSightingRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw new HTTPException(ErrorCode.INVALID_INPUT, {
      message: parsed.error.issues[0]?.message ?? 'invalid_body',
    })
  }

  const { placeId, productId, amount, currency, seenAt } = parsed.data
  const db = getDb(c.env)
  const seenAtDate = seenAt ? new Date(seenAt) : new Date()

  const [inserted] = await db
    .insert(priceSighting)
    .values({
      placeId,
      productId,
      amount,
      currency: currency.toUpperCase(),
      seenAt: seenAtDate,
      reporterUserId: userId,
    })
    .returning()

  await enqueuePriceAlertEvaluation(
    { userId, productId, placeId, amount, currency, seenAt: seenAtDate },
    c.env,
  )

  return c.json({
    priceSighting: PriceSightingSchema.parse({
      priceSightingId: inserted.priceSightingId,
      productId: inserted.productId,
      placeId: inserted.placeId,
      amount: inserted.amount,
      currency: inserted.currency,
      seenAt: inserted.seenAt.toISOString(),
    }),
  })
}
```

**Thresholds:** >15% increase / >10% decrease vs 90-day rolling average — evaluated in `generate.alert.candidates.helper`.
