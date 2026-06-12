# Gap snapshot: match.recall.entry.handler.ts

Target: `backend/src/jobs/recall/match.recall.entry.handler.ts`

**Status:** Not in repo. From `build-guide/15-recall-alerts/02-recall-matching.md`.

**Efficiency rule:** One query per recall entry against all exposure rows — never one query per user.

---

```typescript
import { and, eq, gte, or, sql } from 'drizzle-orm'
import type { AppContext } from '@/types'
import { recallEntries, recallScanMatches } from '@shared/drizzle/schema/recall.schema'
import { scanEvents } from '@shared/drizzle/schema/scan.schema'
import { classifyMatchConfidence } from './_helpers/classify.match.confidence.helper'
import { notifyUserRecallMatch } from './_helpers/notify.user.recall.match.helper'

const PROBABLE_WINDOW_DAYS = 90

export async function matchRecallEntryHandler(
  ctx: AppContext,
  recallEntryId: string,
): Promise<{ matchesCreated: number; usersNotified: number }> {
  const db = ctx.db
  const recall = await db.query.recallEntries.findFirst({
    where: eq(recallEntries.id, recallEntryId),
  })

  if (!recall || recall.status !== 'active') {
    return { matchesCreated: 0, usersNotified: 0 }
  }

  const probableCutoff = new Date()
  probableCutoff.setDate(probableCutoff.getDate() - PROBABLE_WINDOW_DAYS)

  const exposureHits = await db
    .select({
      scanEventId: scanEvents.id,
      userId: scanEvents.userId,
      upc: scanEvents.upc,
      productId: scanEvents.productId,
      capturedAt: scanEvents.capturedAt,
    })
    .from(scanEvents)
    .where(
      and(
        recall.upc
          ? eq(scanEvents.upc, recall.upc)
          : sql`false`,
        gte(scanEvents.capturedAt, probableCutoff),
      ),
    )

  let matchesCreated = 0
  let usersNotified = 0

  for (const hit of exposureHits) {
    const confidence = classifyMatchConfidence({
      recall,
      scannedAt: hit.capturedAt,
      scannedLot: null,
    })

    if (confidence === 'informational') {
      await insertMatchIfNew(db, recall.id, hit.userId, hit.scanEventId, confidence)
      matchesCreated += 1
      continue
    }

    const matchId = await insertMatchIfNew(db, recall.id, hit.userId, hit.scanEventId, confidence)
    if (!matchId) continue

    matchesCreated += 1
    const notified = await notifyUserRecallMatch(ctx, {
      userId: hit.userId,
      matchId,
      recallEntryId: recall.id,
      matchConfidence: confidence,
      productName: recall.productName,
      reason: recall.reason,
      scannedAt: hit.capturedAt.toISOString(),
    })

    if (notified) usersNotified += 1
  }

  return { matchesCreated, usersNotified }
}

async function insertMatchIfNew(
  db: AppContext['db'],
  recallId: string,
  userId: string,
  scanEventId: string,
  confidence: string,
): Promise<string | null> {
  const existing = await db.query.recallScanMatches.findFirst({
    where: and(
      eq(recallScanMatches.recallId, recallId),
      eq(recallScanMatches.userId, userId),
      eq(recallScanMatches.scanEventId, scanEventId),
    ),
  })

  if (existing) return null

  const [row] = await db
    .insert(recallScanMatches)
    .values({
      recallId,
      userId,
      scanEventId,
      matchConfidence: confidence,
    })
    .returning({ id: recallScanMatches.id })

  return row?.id ?? null
}
```

**Post-MVP:** UNION query with `product_exposure` table; geo-scope filter per spec 26.
