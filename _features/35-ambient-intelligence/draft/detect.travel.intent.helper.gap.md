# Draft: detect.travel.intent.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/detect.travel.intent.helper.ts`

**Gap (feature 35):** Voice/calendar/map → `travel_intent` row + optional `travel_preload` schedule.

**Source:** `brioela-specs/22-pre-trip-food-intelligence.md`

---

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { TravelIntentSource } from '@/agents/brain/_schemas/travel.intent.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export type TravelIntentDetection = {
  destinationCity: string
  destinationCountry: string | null
  departureDate: number | null
  returnDate: number | null
  source: TravelIntentSource
  confidence: number
}

const HIGH_CONFIDENCE_THRESHOLD = 0.85

export async function detectAndRecordTravelIntent(
  database: BrainDatabase,
  userId: string,
  detection: TravelIntentDetection,
): Promise<{ intentId: string; scheduledPreload: boolean }> {
  const intentId = createId()
  const now = readCurrentEpochMs()

  const status =
    detection.confidence >= HIGH_CONFIDENCE_THRESHOLD ? 'confirmed' : 'pending'

  // TODO: insert travel_intent

  let scheduledPreload = false
  if (status === 'confirmed' && detection.departureDate !== null) {
    const preloadAt = computePreloadScheduleAt(detection.departureDate, now)
    // TODO(09): schedule_user_alarm({ alarm_type: 'travel_preload', scheduled_at: preloadAt, payload: { intentId } })
    scheduledPreload = true
  }

  return { intentId, scheduledPreload }
}

export function computePreloadScheduleAt(departureDate: number, now: number): number {
  const fortyEightHoursMs = 48 * 60 * 60 * 1000
  if (departureDate - now > fortyEightHoursMs) {
    return departureDate - fortyEightHoursMs
  }
  return now
}
```

Low-confidence map search: return `pending` — client asks once before confirm.
