# Draft: assemble.craving.evidence.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/craving-decoder/assemble.craving.evidence.helper.ts`

**Gap:** No orchestration for six-step evidence bundle injected into agent context.

**Source:** `build-guide/39-craving-decoder/02-evidence-assembly.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { estimateEatingGap } from '@/agents/brain/_helpers/craving-decoder/estimate.eating.gap.helper'
import { searchCravingHistory } from '@/agents/brain/_helpers/craving-decoder/search.craving.history.helper'
import { readPhysiologicalContext } from '@/agents/brain/_helpers/craving-decoder/read.physiological.context.helper'
import { readCravingContextSignals } from '@/agents/brain/_helpers/craving-decoder/read.craving.context.signals.helper'
import { readGlucoseCravingContext } from '@/agents/brain/_helpers/craving-decoder/read.glucose.craving.context.helper'

export type AssembleCravingEvidenceInput = {
  userId: string
  category: string
  nowMs?: number
}

export type CravingEvidenceBundle = {
  physiological: Awaited<ReturnType<typeof readPhysiologicalContext>>
  eatingGap: Awaited<ReturnType<typeof estimateEatingGap>>
  history: Awaited<ReturnType<typeof searchCravingHistory>>
  contextSignals: Awaited<ReturnType<typeof readCravingContextSignals>>
  glucose: Awaited<ReturnType<typeof readGlucoseCravingContext>>
  assembledAt: number
}

export async function assembleCravingEvidence(
  db: BrainSqlite,
  input: AssembleCravingEvidenceInput,
): Promise<CravingEvidenceBundle> {
  const nowMs = input.nowMs ?? Date.now()

  // Fast path: parallel reads that do not block first sentence in agent — caller may pass partial bundle first
  const [physiological, eatingGap, history, contextSignals, glucose] = await Promise.all([
    readPhysiologicalContext(db, { userId: input.userId }),
    estimateEatingGap(db, input.userId, nowMs),
    searchCravingHistory(db, { userId: input.userId, category: input.category, limit: 8 }),
    readCravingContextSignals(db, { userId: input.userId, lookbackDays: 7 }),
    readGlucoseCravingContext(db, { userId: input.userId, nowMs }),
  ])

  return {
    physiological,
    eatingGap,
    history,
    contextSignals,
    glucose,
    assembledAt: nowMs,
  }
}

export function formatCravingEvidenceForAgent(bundle: CravingEvidenceBundle): string {
  return JSON.stringify(
    {
      physiological: bundle.physiological,
      eatingGap: {
        hoursSinceObserved: bundle.eatingGap.hoursSinceObserved,
        honestyPhrase: bundle.eatingGap.honestyPhrase,
      },
      recentDecodes: bundle.history.map((h) => ({
        at: h.capturedAt,
        causes: h.payload.namedCauses,
        category: h.payload.category,
      })),
      contextSignals: bundle.contextSignals,
      glucose: bundle.glucose,
    },
    null,
    2,
  )
}
```
