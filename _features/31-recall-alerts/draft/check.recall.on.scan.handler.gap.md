# Gap snapshot: check.recall.on.scan.handler.ts

Target: `backend/src/jobs/recall/check.recall.on.scan.handler.ts`

**Status:** Not in repo. Path B per `implementable-specs/10-scheduled-alarms.md` — **not** `scheduled_alarms`.

**Caller:** **24** `resolve.scan.handler.ts` after `scan_events` insert (fire-and-forget QStash).

---

```typescript
import { and, eq } from 'drizzle-orm'
import type { AppContext } from '@/types'
import { recallEntries } from '@shared/drizzle/schema/recall.schema'
import { classifyMatchConfidence } from './_helpers/classify.match.confidence.helper'
import { matchRecallEntryHandler } from './match.recall.entry.handler'

export type CheckRecallOnScanInput = {
  scanEventId: string
  userId: string
  upc: string
  lotNumber: string | null
  capturedAt: string
}

/** Reverse check: user scanned product — are there active recalls? Path B, not scheduled_alarms. */
export async function checkRecallOnScanHandler(
  ctx: AppContext,
  input: CheckRecallOnScanInput,
): Promise<void> {
  const activeRecalls = await ctx.db
    .select()
    .from(recallEntries)
    .where(and(eq(recallEntries.upc, input.upc), eq(recallEntries.status, 'active')))

  for (const recall of activeRecalls) {
    const confidence = classifyMatchConfidence({
      recall,
      scannedAt: new Date(input.capturedAt),
      scannedLot: input.lotNumber,
    })

    if (confidence === 'informational') continue

    await matchRecallEntryHandler(ctx, recall.id)
  }
}

export async function enqueueRecallScanCheck(
  ctx: AppContext,
  input: CheckRecallOnScanInput,
): Promise<void> {
  const { qstash } = ctx
  await qstash.publishJSON({
    url: `${ctx.env.WORKER_PUBLIC_URL}/jobs/recall/check-on-scan`,
    body: input,
    retries: 2,
  })
}
```

**Boundary:** This is the implementable-spec `recall_check` **example** (immediate on scan). It is **not** the obsolete 6h `alarm_type: recall_check` in `05-alarm-system.md`.
