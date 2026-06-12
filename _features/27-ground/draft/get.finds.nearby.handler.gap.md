# Gap snapshot: get.finds.nearby.handler.ts

Target: `backend/src/api/finds/_handlers/get.finds.nearby.handler.ts`

**Status:** Not in repo. From `build-guide/09-ground/04-map-rendering.md`, 35b Angle 1.

```typescript
import type { AppContext } from '@/index'
import {
  FindNearbyQuerySchema,
  LocationSignalSummarySchema,
} from '@brioela/shared/validator/find'
import { scoreFindRelevance } from '../_helpers/score.find.relevance.helper'
import { getDb } from '@/core/db'
import { locationSignalSummary } from '@brioela/shared/drizzle/schema/location.signal.summary'
import { and, gte, lte, eq, inArray } from 'drizzle-orm'

const BASE_DOT_SIZE = 8
const RELEVANCE_SIZE_MULTIPLIER = 0.8

export async function getFindsNearby(c: AppContext) {
  const userId = c.get('userId')
  const query = FindNearbyQuerySchema.safeParse(c.req.query())

  if (!query.success) {
    return c.json({ error: 'invalid_query', details: query.error.flatten() }, 400)
  }

  const { minLat, minLng, maxLat, maxLng, signalTypes } = query.data
  const db = getDb(c.env)

  const conditions = [
    gte(locationSignalSummary.activeCount, 1),
  ]

  if (signalTypes?.length) {
    conditions.push(inArray(locationSignalSummary.signalType, signalTypes))
  }

  const rows = await db
    .select()
    .from(locationSignalSummary)
    .where(and(...conditions))

  const placeCoords = await resolveLocationCoords(
    rows.map((r) => r.locationId),
    { minLat, minLng, maxLat, maxLng },
    c.env,
  )

  const userProfile = await fetchUserIngredientProfile(userId, c.env)

  const summaries = await Promise.all(
    rows
      .filter((row) => placeCoords.has(row.locationId))
      .map(async (row) => {
        const relevanceScore = await scoreFindRelevance({
          signalType: row.signalType,
          locationId: row.locationId,
          activeCount: row.activeCount,
          lastFindAt: row.lastFindAt?.toISOString() ?? null,
          userProfile,
        })

        const baseSize = Math.min(5, Math.max(1, row.activeCount))
        const renderedDotSize =
          BASE_DOT_SIZE * baseSize * (1 + relevanceScore * RELEVANCE_SIZE_MULTIPLIER)

        return LocationSignalSummarySchema.parse({
          locationId: row.locationId,
          signalType: row.signalType,
          activeCount: row.activeCount,
          lastFindAt: row.lastFindAt?.toISOString() ?? null,
          relevanceScore,
          renderedDotSize,
          lat: placeCoords.get(row.locationId)!.lat,
          lng: placeCoords.get(row.locationId)!.lng,
        })
      }),
  )

  return c.json({ summaries })
}

async function resolveLocationCoords(
  locationIds: string[],
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number },
  env: Env,
): Promise<Map<string, { lat: number; lng: number }>> {
  // Reads map_place from **28** — stub until places table ships
  return new Map()
}

async function fetchUserIngredientProfile(userId: string, env: Env) {
  // Brain DO RPC: top ingredients from scan history + constraints + cooking memory
  return { topIngredients: [] as string[], constraintFlags: [] as string[] }
}
```

**Map rule:** never query individual `find` rows for tile rendering — summaries only.
