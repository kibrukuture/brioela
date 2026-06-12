# Draft: build.time.machine.candidates.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/build.time.machine.candidates.helper.ts`

**Gap (feature 35):** Weekly pass — 5–10 ranked moments, 14d expiry.

**Source:** `brioela-specs/38-food-time-machine.md`, `build-guide/18-ambient-intelligence/04-food-time-machine.md`

---

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { TimeMachineMomentType } from '@/agents/brain/_schemas/time.machine.moment.schema'

const CANDIDATE_TARGET_MIN = 5
const CANDIDATE_TARGET_MAX = 10
const MOMENT_TTL_MS = 14 * 24 * 60 * 60 * 1000

type ScoredMoment = {
  momentType: TimeMachineMomentType
  text: string
  entityKind: string
  entityId: string | null
  salience: number
}

export async function buildTimeMachineCandidates(
  database: BrainDatabase,
  userId: string,
  now: number,
): Promise<{ created: number }> {
  // TODO(05): read memory_event scans, receipts; recipes; cooking sessions
  // Block: illness events, medical conditions, guest constraints, shame patterns

  const candidates: ScoredMoment[] = []
  // Heuristic ranking: first-ever high, long_gap high, generational high, round count medium, staple low

  const ranked = candidates
    .sort((a, b) => b.salience - a.salience)
    .slice(0, CANDIDATE_TARGET_MAX)

  for (const moment of ranked) {
    // TODO: insert time_machine_moment + optional ambient_candidate mirror
    void createId()
    void moment
  }

  return { created: Math.min(ranked.length, CANDIDATE_TARGET_MAX) }
}

export function momentExpiresAt(createdAt: number): number {
  return createdAt + MOMENT_TTL_MS
}
```

No push — inline surfaces only via `pick.time.machine.moment.helper.ts`.
