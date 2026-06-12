# Gap snapshot: recall API handlers

Target: `backend/src/api/recall/_handlers/`

**Status:** Not in repo. From `build-guide/15-recall-alerts/04-recall-detail-and-resolution.md`.

---

```typescript
// list.recall.alerts.handler.ts
import { eq, isNull } from 'drizzle-orm'
import type { AppContext } from '@/types'
import { recallScanMatches, recallEntries } from '@shared/drizzle/schema/recall.schema'

export async function listRecallAlertsHandler(ctx: AppContext, userId: string) {
  const rows = await ctx.db
    .select({
      match: recallScanMatches,
      recall: recallEntries,
    })
    .from(recallScanMatches)
    .innerJoin(recallEntries, eq(recallScanMatches.recallId, recallEntries.id))
    .where(eq(recallScanMatches.userId, userId))
    .orderBy(recallScanMatches.createdAt)

  return rows.map(({ match, recall }) => ({
    id: match.id,
    matchConfidence: match.matchConfidence,
    notifiedAt: match.notifiedAt,
    resolvedAt: match.resolvedAt,
    recall: {
      productName: recall.productName,
      reason: recall.reason,
      rawNoticeUrl: recall.rawNoticeUrl,
      lotNumbersJson: recall.lotNumbersJson,
      source: recall.source,
    },
  }))
}
```

```typescript
// get.recall.alert.handler.ts
import { and, eq } from 'drizzle-orm'
import type { AppContext } from '@/types'
import { recallScanMatches, recallEntries } from '@shared/drizzle/schema/recall.schema'
import { scanEvents } from '@shared/drizzle/schema/scan.schema'
import { RecallAlertDetailSchema } from '@shared/validator/recall/recall.alert.schema'

export async function getRecallAlertHandler(
  ctx: AppContext,
  userId: string,
  matchId: string,
) {
  const row = await ctx.db
    .select({
      match: recallScanMatches,
      recall: recallEntries,
    })
    .from(recallScanMatches)
    .innerJoin(recallEntries, eq(recallScanMatches.recallId, recallEntries.id))
    .where(and(eq(recallScanMatches.id, matchId), eq(recallScanMatches.userId, userId)))
    .limit(1)

  const hit = row[0]
  if (!hit) return null

  let scannedAt: string | null = null
  let productPhotoUrl: string | null = null

  if (hit.match.scanEventId) {
    const scan = await ctx.db.query.scanEvents.findFirst({
      where: eq(scanEvents.id, hit.match.scanEventId),
    })
    scannedAt = scan?.capturedAt?.toISOString() ?? null
  }

  return RecallAlertDetailSchema.parse({
    ...hit.match,
    recallId: hit.match.recallId,
    recall: hit.recall,
    productName: hit.recall.productName,
    productPhotoUrl,
    scannedLot: null,
    scannedAt,
  })
}
```

```typescript
// resolve.recall.alert.handler.ts
import { and, eq } from 'drizzle-orm'
import type { AppContext } from '@/types'
import { recallScanMatches } from '@shared/drizzle/schema/recall.schema'

export async function resolveRecallAlertHandler(
  ctx: AppContext,
  userId: string,
  matchId: string,
): Promise<boolean> {
  const result = await ctx.db
    .update(recallScanMatches)
    .set({ resolvedAt: new Date() })
    .where(and(eq(recallScanMatches.id, matchId), eq(recallScanMatches.userId, userId)))
    .returning({ id: recallScanMatches.id })

  return result.length > 0
}
```

```typescript
// recall.route.ts
import { Hono } from 'hono'
import type { AppContext } from '@/types'
import { RECALL_ROUTE_PATTERNS } from '@shared/routes/recall.routes'
import { listRecallAlertsHandler } from './_handlers/list.recall.alerts.handler'
import { getRecallAlertHandler } from './_handlers/get.recall.alert.handler'
import { resolveRecallAlertHandler } from './_handlers/resolve.recall.alert.handler'

export const recallRouter = new Hono<{ Bindings: AppContext['env']; Variables: AppContext }>()
  .get(RECALL_ROUTE_PATTERNS.alerts, async (c) => {
    const userId = c.get('userId')
    const alerts = await listRecallAlertsHandler(c.var, userId)
    return c.json({ alerts })
  })
  .get(RECALL_ROUTE_PATTERNS.alertById, async (c) => {
    const userId = c.get('userId')
    const matchId = c.req.param('matchId')
    const detail = await getRecallAlertHandler(c.var, userId, matchId)
    if (!detail) return c.json({ error: 'not_found' }, 404)
    return c.json(detail)
  })
  .post(RECALL_ROUTE_PATTERNS.resolveAlert, async (c) => {
    const userId = c.get('userId')
    const matchId = c.req.param('matchId')
    const ok = await resolveRecallAlertHandler(c.var, userId, matchId)
    if (!ok) return c.json({ error: 'not_found' }, 404)
    return c.json({ resolved: true })
  })
```
