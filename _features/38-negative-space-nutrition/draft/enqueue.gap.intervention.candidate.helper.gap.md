# Draft: enqueue.gap.intervention.candidate.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/negative-space/enqueue.gap.intervention.candidate.helper.ts`

**Gap:** Step 6 — shared intervention queue + spec **17** weekly budget. **35** owns `ambient_candidate` table.

**Source:** `brioela-specs/50-negative-space-nutrition.md`, `brioela-specs/17-behavioral-food-pattern-detection.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import type { GapCandidate } from './dedupe.gap.candidates.helper'

export const NEGATIVE_SPACE_GAP_CANDIDATE_KIND = 'negative_space_gap' as const

const WEEKLY_INSIGHT_BUDGET_MS = 7 * 24 * 60 * 60 * 1000

export async function enqueueGapInterventionCandidate(
  db: BrainSqlite,
  input: {
    userId: string
    gapId: string
    candidate: GapCandidate
    now: number
  },
): Promise<{ enqueued: boolean; reason?: string }> {
  const recentInsight = await countRecentConversationalInsights(db, input.userId, input.now)
  if (recentInsight > 0) {
    return { enqueued: false, reason: 'weekly_insight_budget_exhausted' }
  }

  const top = input.candidate
  if (!top) {
    return { enqueued: false, reason: 'no_candidate' }
  }

  await insertAmbientCandidate(db, {
    userId: input.userId,
    kind: NEGATIVE_SPACE_GAP_CANDIDATE_KIND,
    payloadJson: JSON.stringify({
      gapId: input.gapId,
      category: top.category,
      gapClass: top.gapClass,
      confidence: top.confidence,
      evidence: top.evidence,
    }),
    createdAt: input.now,
    expiresAt: input.now + 14 * 24 * 60 * 60 * 1000,
  })

  return { enqueued: true }
}

async function countRecentConversationalInsights(
  db: BrainSqlite,
  userId: string,
  now: number,
): Promise<number> {
  void db
  void userId
  void now
  void WEEKLY_INSIGHT_BUDGET_MS
  return 0
}

async function insertAmbientCandidate(
  db: BrainSqlite,
  row: {
    userId: string
    kind: typeof NEGATIVE_SPACE_GAP_CANDIDATE_KIND
    payloadJson: string
    createdAt: number
    expiresAt: number
  },
): Promise<void> {
  void db
  void row
}
```

**35 dependency:** `ambient_candidate` table must exist before enqueue ships.
