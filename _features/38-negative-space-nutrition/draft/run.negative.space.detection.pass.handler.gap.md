# Draft: run.negative.space.detection.pass.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/negative-space/run.negative.space.detection.pass.handler.ts`

**Gap:** Orchestrates six-step weekly pass on `behavior_pattern_detection` alarm wake.

**Source:** `build-guide/37-negative-space-nutrition/02-detection-pass.md`, `brioela-specs/50-negative-space-nutrition.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { computeCoverageScore, loadCoverageInputs } from '@/helpers/negative-space/compute.coverage.score.helper'
import { checkCoverageFloor } from '@/helpers/negative-space/check.coverage.floor.helper'
import { buildPresenceMap } from '@/helpers/negative-space/build.presence.map.helper'
import { loadObservedFoodStream } from '@/helpers/negative-space/load.observed.food.stream.helper'
import { detectStructuralAbsences } from '@/helpers/negative-space/detect.structural.absences.helper'
import { detectDisplacementGaps } from '@/helpers/negative-space/detect.displacement.gaps.helper'
import { dedupeGapCandidates } from '@/helpers/negative-space/dedupe.gap.candidates.helper'
import { checkConditionGapSuppression } from '@/helpers/negative-space/check.condition.gap.suppression.helper'
import { enqueueGapInterventionCandidate } from '@/helpers/negative-space/enqueue.gap.intervention.candidate.helper'
import { persistNutrientPresenceWindow } from './persist.nutrient.presence.window.handler'
import { insertNutritionGapCandidate } from './insert.nutrition.gap.candidate.handler'

const WINDOW_MS = 6 * 7 * 24 * 60 * 60 * 1000

export async function runNegativeSpaceDetectionPass(
  database: BrainDatabase,
  input: { userId: string; now: number },
): Promise<void> {
  const windowEnd = input.now
  const windowStart = windowEnd - WINDOW_MS

  const coverageInputs = await loadCoverageInputs(
    database.sqlite,
    input.userId,
    windowStart,
    windowEnd,
  )
  const coverage = computeCoverageScore(coverageInputs)
  const floor = await checkCoverageFloor(database.sqlite, input.userId, coverage)

  if (!floor.clearsFloor || floor.qualifyingWeeks < 6) {
    return // silent abort — spec 50
  }

  const observed = await loadObservedFoodStream(
    database.sqlite,
    input.userId,
    windowStart,
    windowEnd,
  )
  const presenceMap = await buildPresenceMap(observed)

  await persistNutrientPresenceWindow(database.sqlite, {
    userId: input.userId,
    periodStart: windowStart,
    periodEnd: windowEnd,
    coverageScore: coverage.score,
    presenceMap,
    computedAt: input.now,
  })

  const structural = detectStructuralAbsences(presenceMap, floor.qualifyingWeeks)
  const displacement = await detectDisplacementGaps({
    presenceMap,
    dietTimeline: await loadDietTimeline(database.sqlite, input.userId),
    driftPatternIds: await loadDriftPatternIds(database.sqlite, input.userId),
  })

  const merged = dedupeGapCandidates({
    candidates: [...structural, ...displacement],
    dietGapsMemory: await loadDietGapsMemory(database.sqlite, input.userId),
    contradictions: await loadGapContradictions(database.sqlite, input.userId),
  })

  const allowed = await checkConditionGapSuppression(database.sqlite, input.userId, merged)
  const top = allowed[0]
  if (!top) return

  const gapId = await insertNutritionGapCandidate(database.sqlite, input.userId, top, input.now)
  await enqueueGapInterventionCandidate(database.sqlite, {
    userId: input.userId,
    gapId,
    candidate: top,
    now: input.now,
  })
}

async function loadDietTimeline(db: BrainDatabase['sqlite'], userId: string) {
  void db
  void userId
  return []
}

async function loadDriftPatternIds(db: BrainDatabase['sqlite'], userId: string) {
  void db
  void userId
  return []
}

async function loadDietGapsMemory(db: BrainDatabase['sqlite'], userId: string) {
  void db
  void userId
  return {}
}

async function loadGapContradictions(db: BrainDatabase['sqlite'], userId: string) {
  void db
  void userId
  return []
}
```

**Cadence:** Called from **12** `runBehaviorPatternPass` after `BehaviorPatternAgent` — same `behavior_pattern_detection` wake, no new alarm_type.
