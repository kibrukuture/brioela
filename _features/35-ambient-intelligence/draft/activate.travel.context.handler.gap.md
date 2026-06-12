# Draft: activate.travel.context.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/activate.travel.context.handler.ts`

**Gap (feature 35):** App-open arrival — mark intent active, switch scan priority, notify **28** map consumer.

**Source:** `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'

export type ArrivalCheckInput = {
  userId: string
  deviceLat: number
  deviceLng: number
  now: number
}

export type TravelContextActivation = {
  activated: boolean
  intentId: string | null
  geoRegion: string | null
  copyLine: string | null
}

export async function activateTravelContextIfArrived(
  database: BrainDatabase,
  input: ArrivalCheckInput,
): Promise<TravelContextActivation> {
  // Load confirmed travel_intent where device in destination geoRegion
  // If match:
  //   UPDATE status = 'active'
  //   Set agent_state travel.active_geo_region
  //   Apply local labeling notes to scan/vision config
  //   Return copy: "You're in Tokyo. I've loaded local food intel..."

  return {
    activated: false,
    intentId: null,
    geoRegion: null,
    copyLine: null,
  }
}

export async function deactivateTravelContextOnReturnHome(
  database: BrainDatabase,
  userId: string,
): Promise<void> {
  // Mark intent expired; revert scan DB priority; schedule cache expiry
}
```

**28** reads Redis map cache keys written by `write.travel.local.cache.helper.ts`.
