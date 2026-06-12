# Draft: estimate.eating.gap.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/craving-decoder/estimate.eating.gap.helper.ts`

**Gap:** No helper for step 2 eating-gap evidence. Must not conflate with **38** nutrient absence.

**Source:** `build-guide/39-craving-decoder/02-evidence-assembly.md`, `brioela-specs/52-craving-decoder.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { memoryEvent } from '@/agents/brain/_schemas'
import { and, desc, eq, inArray } from 'drizzle-orm'

const EATING_EVENT_KINDS = [
  'product_scanned',
  'receipt_ingested',
  'meal_logged',
  'recipe_cooked',
  'visual_intake',
] as const

export type EatingGapResult = {
  hoursSinceObserved: number | null
  lastObservedAt: number | null
  lastKind: (typeof EATING_EVENT_KINDS)[number] | null
  honestyPhrase: string
}

export async function estimateEatingGap(
  db: BrainSqlite,
  userId: string,
  nowMs: number = Date.now(),
): Promise<EatingGapResult> {
  const [last] = await db
    .select({
      kind: memoryEvent.kind,
      capturedAt: memoryEvent.capturedAt,
    })
    .from(memoryEvent)
    .where(
      and(
        eq(memoryEvent.userId, userId),
        inArray(memoryEvent.kind, [...EATING_EVENT_KINDS]),
      ),
    )
    .orderBy(desc(memoryEvent.capturedAt))
    .limit(1)

  if (!last) {
    return {
      hoursSinceObserved: null,
      lastObservedAt: null,
      lastKind: null,
      honestyPhrase: 'nothing eating-related has been logged that I can see',
    }
  }

  const hours = Math.max(0, (nowMs - last.capturedAt) / (60 * 60 * 1000))
  const rounded = Math.round(hours * 10) / 10

  return {
    hoursSinceObserved: rounded,
    lastObservedAt: last.capturedAt,
    lastKind: last.kind as EatingGapResult['lastKind'],
    honestyPhrase: `nothing's been logged since about ${formatRelativeHours(rounded)}`,
  }
}

function formatRelativeHours(hours: number): string {
  if (hours < 1) return 'the last hour'
  if (hours < 24) return `${Math.round(hours)} hours ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}
```

**37 vs 38:** This helper never classifies nutrient categories or runs coverage gates — recency only.
