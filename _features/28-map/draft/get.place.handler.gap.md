# Gap snapshot: get.place.handler.ts

Target: `backend/src/api/map/_handlers/get.place.handler.ts`

**Status:** Not in repo. From `build-guide/10-map/06-map-ui-layers.md`.

```typescript
import type { AppContext } from '@/index'
import { HTTPException } from 'hono/http-exception'
import { ErrorCode } from '@brioela/shared/types/api'
import { PlaceDetailSchema } from '@brioela/shared/validator/map.schema'
import { getDb } from '@/core/db'
import { mapPlace } from '@brioela/shared/drizzle/schema/map.place.schema'
import { mapPlaceSignal } from '@brioela/shared/drizzle/schema/map.place.signal.schema'
import { productSighting } from '@brioela/shared/drizzle/schema/product.sighting.schema'
import { priceSighting } from '@brioela/shared/drizzle/schema/price.sighting.schema'
import { eq, desc, and, gte } from 'drizzle-orm'
import { applySightingDecay } from '../_helpers/decay.sighting.helper'
import { scoreMenuFit } from '../_helpers/score.menu.fit.helper'
import { summarizeGroundForPlace } from '../_helpers/read.ground.density.helper'

export async function getPlace(c: AppContext) {
  const userId = c.get('userId')
  const placeId = c.req.param('id')

  if (!placeId) {
    throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'place_id_required' })
  }

  const db = getDb(c.env)

  const [placeRow] = await db.select().from(mapPlace).where(eq(mapPlace.placeId, placeId)).limit(1)
  if (!placeRow) {
    throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'place_not_found' })
  }

  const [signalRow] = await db
    .select()
    .from(mapPlaceSignal)
    .where(eq(mapPlaceSignal.placeId, placeId))
    .limit(1)

  const sightingRows = await db
    .select()
    .from(productSighting)
    .where(
      and(
        eq(productSighting.placeId, placeId),
        gte(productSighting.confidence, 0.2),
      ),
    )
    .orderBy(desc(productSighting.seenAt))
    .limit(50)

  const priceRows = await db
    .select()
    .from(priceSighting)
    .where(eq(priceSighting.placeId, placeId))
    .orderBy(desc(priceSighting.seenAt))
    .limit(20)

  const decayedSightings = sightingRows.map((row) =>
    applySightingDecay({
      sightingId: row.sightingId,
      placeId: row.placeId,
      productId: row.productId,
      seenAt: row.seenAt.toISOString(),
      confidence: row.confidence,
      firstSeenAt: row.firstSeenAt?.toISOString() ?? null,
    }),
  )

  const menuFitPreview = await scoreMenuFit({ placeId, userId, env: c.env })
  const groundSummaryLines = await summarizeGroundForPlace(placeId, c.env)

  const detail = PlaceDetailSchema.parse({
    place: {
      placeId: placeRow.placeId,
      kind: placeRow.kind,
      name: placeRow.name,
      lat: placeRow.lat,
      lng: placeRow.lng,
      geohash: placeRow.geohash,
      verificationStatus: placeRow.verificationStatus,
      addressJson: placeRow.addressJson ?? null,
    },
    signal: signalRow
      ? {
          placeId: signalRow.placeId,
          healthyScore: signalRow.healthyScore,
          communityScore: signalRow.communityScore,
          affordabilityScore: signalRow.affordabilityScore,
          recencyScore: signalRow.recencyScore,
          updatedAt: signalRow.updatedAt.toISOString(),
        }
      : {
          placeId,
          healthyScore: 0,
          communityScore: 0,
          affordabilityScore: 0,
          recencyScore: 0,
          updatedAt: new Date().toISOString(),
        },
    sightings: decayedSightings,
    recentPrices: priceRows.map((r) => ({
      priceSightingId: r.priceSightingId,
      productId: r.productId,
      placeId: r.placeId,
      amount: r.amount,
      currency: r.currency,
      seenAt: r.seenAt.toISOString(),
    })),
    menuFitPreview,
    groundSummaryLines,
  })

  return c.json(detail)
}
```

**Ground finds list:** full find rows via **27** `GET /api/finds/locations/:locationId` from mobile — this handler returns summary lines only.
