# Gap snapshot: get.nearby.handler.ts

Target: `backend/src/api/map/_handlers/get.nearby.handler.ts`

**Status:** Not in repo. From `build-guide/10-map/03-nearby-ranking-api.md`, `17-menu-scanning/07-personalized-restaurant-discovery.md`.

```typescript
import type { AppContext } from '@/index'
import { HTTPException } from 'hono/http-exception'
import { ErrorCode } from '@brioela/shared/types/api'
import {
  MapNearbyQuerySchema,
  MapNearbyResponseSchema,
} from '@brioela/shared/validator/map.schema'
import { queryPlacesInBbox } from '../_helpers/query.places.geo.helper'
import { rankPlaces } from '../_helpers/rank.places.helper'
import { checkMapEntitlement } from '../_helpers/check.map.entitlement.helper'

export async function getNearby(c: AppContext) {
  const userId = c.get('userId')
  const raw = {
    minLat: c.req.query('minLat'),
    minLng: c.req.query('minLng'),
    maxLat: c.req.query('maxLat'),
    maxLng: c.req.query('maxLng'),
    zoom: c.req.query('zoom'),
    openNow: c.req.query('openNow'),
    showAll: c.req.query('showAll'),
  }

  const parsed = MapNearbyQuerySchema.safeParse(raw)
  if (!parsed.success) {
    throw new HTTPException(ErrorCode.INVALID_INPUT, {
      message: parsed.error.issues[0]?.message ?? 'invalid_query',
    })
  }

  await checkMapEntitlement(userId, 'nearby', c.env)

  const { minLat, minLng, maxLat, maxLng, showAll } = parsed.data

  const candidates = await queryPlacesInBbox(
    { minLat, minLng, maxLat, maxLng },
    c.env,
  )

  const userLocation = parseOptionalUserLocation(c)
  const constraintProfile = await fetchConstraintProfile(userId, c.env)

  const ranked = await rankPlaces({
    candidates,
    userId,
    constraintProfile,
    userLocation,
    showAll: showAll ?? false,
    env: c.env,
  })

  const response = MapNearbyResponseSchema.parse({
    places: ranked,
    bbox: { minLat, minLng, maxLat, maxLng },
  })

  return c.json(response)
}

function parseOptionalUserLocation(c: AppContext) {
  const lat = c.req.query('userLat')
  const lng = c.req.query('userLng')
  if (!lat || !lng) return null
  const latN = Number.parseFloat(lat)
  const lngN = Number.parseFloat(lng)
  if (Number.isNaN(latN) || Number.isNaN(lngN)) return null
  return { lat: latN, lng: lngN }
}

async function fetchConstraintProfile(userId: string, env: Env) {
  // Brain DO RPC — hard allergies, dietary identity, boycotts (**07**)
  return {
    hardAllergens: [] as string[],
    dietaryIdentity: null as string | null,
    boycotts: [] as string[],
  }
}
```

**Ranking rule:** hard exclusions first; do not hide world unless hard safety block (`03-nearby-ranking-api.md`).
