# Draft: run.travel.preload.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/run.travel.preload.handler.ts`

**Gap (feature 35):** `travel_preload` alarm body — **14** opens inline `alarm` session then calls this handler.

**Source:** `brioela-specs/22-pre-trip-food-intelligence.md`, `_features/14-brain-alarm-dispatch/spec.md`

---

```typescript
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import type { BrainDatabase } from '@/agents/brain/_database'
import { writeTravelLocalCache } from './write.travel.local.cache.helper'

export type TravelPreloadAlarmPayload = {
  intentId: string
  destination?: string
  departure_at?: number
}

export async function runTravelPreloadHandler(
  database: BrainDatabase,
  brain: BrioelaBrain,
  userId: string,
  payload: TravelPreloadAlarmPayload,
): Promise<{ jobStatus: 'completed' | 'failed'; failureReason?: string }> {
  const intentId = payload.intentId

  // TODO: load travel_intent — abort if expired/dismissed
  // TODO: insert travel_preload_job status processing
  // TODO: enqueue QStash worker POST /api/travel/preload OR inline fetch if small
  // Worker assembles TravelPreloadPackage: mapPlaces, communitySignals, localProductHints, menuFitSummaries

  try {
    await writeTravelLocalCache(database, { userId, intentId, packageJson: '{}' })
    // TODO: mark job completed; alarm action_outcome_json
    // TODO(21): queue travel_preload_ready if user not in active session
    return { jobStatus: 'completed' }
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : 'preload_failed'
    // Quiet retry only if departure not passed — no user notification
    return { jobStatus: 'failed', failureReason }
  }
}
```

Personalized dish verdicts recomputed at scan time — not stored globally in preload package.
