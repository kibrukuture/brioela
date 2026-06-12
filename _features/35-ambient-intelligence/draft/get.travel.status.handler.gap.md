# Draft: get.travel.status.handler.ts (gap — file does not exist)

Target: `backend/src/api/travel/_handlers/get.travel.status.handler.ts`

**Gap (feature 35):** `GET /api/travel/status` — preload complete check.

**Source:** `brioela-specs/22-pre-trip-food-intelligence.md`

---

```typescript
import type { Context } from 'hono'
import type { TravelStatusResponse } from '@brioela/shared/routes/travel.routes'

export async function getTravelStatusHandler(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  // TODO: Brain RPC — load active/confirmed travel_intent + latest travel_preload_job

  const body: TravelStatusResponse = {
    intentId: null,
    status: null,
    preloadComplete: false,
    destinationCity: null,
    geoRegion: null,
  }

  return c.json(body)
}
```
