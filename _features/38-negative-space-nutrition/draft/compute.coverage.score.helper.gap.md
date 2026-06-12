# Draft: compute.coverage.score.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/negative-space/compute.coverage.score.helper.ts`

**Gap:** No coverage gate — spec **50** honesty mechanism.

**Source:** `build-guide/37-negative-space-nutrition/01-coverage-gate.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { COVERAGE_FLOOR } from './coverage.floor.constants'

export type CoverageScoreInput = {
  receiptRegularity: number      // 0–1 vs purchase_pattern median
  mealLogDensity: number         // logs per week / expected
  scanFrequency: number          // scans per week normalized
  observationShare: number       // observed events / plausible eating events
  unclassifiableShare: number    // items without corpus nutrients
}

export type CoverageScoreResult = {
  score: number
  clearsFloor: boolean
  qualifyingWeeks: number
  components: CoverageScoreInput
}

export function computeCoverageScore(input: CoverageScoreInput): CoverageScoreResult {
  const raw =
    input.receiptRegularity * 0.3 +
    input.mealLogDensity * 0.2 +
    input.scanFrequency * 0.2 +
    input.observationShare * 0.3

  const penalty = input.unclassifiableShare * 0.25
  const score = Math.max(0, Math.min(1, raw - penalty))

  return {
    score,
    clearsFloor: score >= COVERAGE_FLOOR,
    qualifyingWeeks: 0, // filled by check.coverage.floor from window history
    components: input,
  }
}

export async function loadCoverageInputs(
  db: BrainSqlite,
  userId: string,
  windowStart: number,
  windowEnd: number,
): Promise<CoverageScoreInput> {
  void db
  void userId
  void windowStart
  void windowEnd
  return {
    receiptRegularity: 0,
    mealLogDensity: 0,
    scanFrequency: 0,
    observationShare: 0,
    unclassifiableShare: 0,
  }
}
```

**Rule:** Below floor → caller aborts detection pass silently. No partial insights.
