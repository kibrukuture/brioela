# Gap snapshot: poll.recall.feeds.job.ts

Target: `backend/src/jobs/recall/poll.recall.feeds.job.ts`

**Status:** Not in repo. From `build-guide/15-recall-alerts/01-recall-feed-polling.md`, spec 26.

**Hard rule:** Global job only — never runs inside per-user Brain DO. Never inserts `scheduled_alarms`.

---

```typescript
import type { AppContext } from '@/types'
import { qstash } from '@/core/clients/qstash'
import { RECALL_JOB_ROUTES } from '@shared/routes/recall.routes'
import { fetchFdaRecalls } from './_adapters/fda.recall.adapter'
import { fetchEfsaRecalls } from './_adapters/efsa.recall.adapter'
import { fetchCfiaRecalls } from './_adapters/cfia.recall.adapter'
import { fetchRasffRecalls } from './_adapters/rasff.recall.adapter'
import { diffRecallCursor } from './_helpers/diff.recall.cursor.helper'
import { upsertRecallEntry } from './_helpers/upsert.recall.entry.helper'

type PollSource = 'fda' | 'efsa' | 'cfia' | 'rasff'

const SOURCE_FETCHERS: Record<PollSource, (ctx: AppContext) => Promise<NormalizedRecall[]>> = {
  fda: fetchFdaRecalls,
  efsa: fetchEfsaRecalls,
  cfia: fetchCfiaRecalls,
  rasff: fetchRasffRecalls,
}

export type NormalizedRecall = {
  externalRecallId: string
  source: PollSource
  productName: string
  upc: string | null
  lotNumbers: string[]
  reason: string
  issuedAt: Date
  expiresAt: Date | null
  rawNoticeUrl: string
  rawPayload: Record<string, unknown>
  retracted: boolean
}

export async function pollRecallFeedsHandler(
  ctx: AppContext,
  source: PollSource,
): Promise<{ inserted: number; retracted: number }> {
  const fetcher = SOURCE_FETCHERS[source]
  const raw = await fetcher(ctx)
  const { netNew, retracted } = await diffRecallCursor(ctx, source, raw)

  let inserted = 0
  for (const recall of netNew) {
    const entryId = await upsertRecallEntry(ctx, recall)
    if (entryId) {
      inserted += 1
      await qstash.publishJSON({
        url: `${ctx.env.WORKER_PUBLIC_URL}${RECALL_JOB_ROUTES.matchEntry}`,
        body: { recallEntryId: entryId },
        retries: 3,
      })
    }
  }

  for (const recall of retracted) {
    await enqueueRetractionNotify(ctx, recall)
  }

  return { inserted, retracted: retracted.length }
}

async function enqueueRetractionNotify(
  ctx: AppContext,
  recall: NormalizedRecall,
): Promise<void> {
  // Load recall_entry id + prior matches → Brain /internal/recall-retraction per user
  void ctx
  void recall
}
```

**Cron registration (Worker bootstrap):**

- FDA: `*/15 * * * *` → `POST /jobs/recall/poll-feeds?source=fda`
- EFSA, RASFF, CFIA: `0 * * * *` → hourly per source
