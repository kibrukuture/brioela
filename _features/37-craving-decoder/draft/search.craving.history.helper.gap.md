# Draft: search.craving.history.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/craving-decoder/search.craving.history.helper.ts`

**Gap:** No craving history query. Spec allows FTS — use kind index until `memory_event_fts` exists.

**Source:** `brioela-specs/52-craving-decoder.md` Technical Constraints

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { memoryEvent } from '@/agents/brain/_schemas'
import { CRAVING_DECODED_EVENT_KIND, type CravingDecodedPayload } from '@brioela/shared/validator/craving-decoder/craving.decoded.event.schema'
import { and, desc, eq, gte } from 'drizzle-orm'

export type CravingHistoryHit = {
  id: string
  capturedAt: number
  payload: CravingDecodedPayload
}

export type CravingHistorySearchInput = {
  userId: string
  category?: string
  lookbackDays?: number
  limit?: number
}

export async function searchCravingHistory(
  db: BrainSqlite,
  input: CravingHistorySearchInput,
): Promise<CravingHistoryHit[]> {
  const lookbackMs = (input.lookbackDays ?? 90) * 24 * 60 * 60 * 1000
  const since = Date.now() - lookbackMs

  const rows = await db
    .select({
      id: memoryEvent.id,
      capturedAt: memoryEvent.capturedAt,
      payloadJson: memoryEvent.payloadJson,
    })
    .from(memoryEvent)
    .where(
      and(
        eq(memoryEvent.userId, input.userId),
        eq(memoryEvent.kind, CRAVING_DECODED_EVENT_KIND),
        gte(memoryEvent.capturedAt, since),
      ),
    )
    .orderBy(desc(memoryEvent.capturedAt))
    .limit(input.limit ?? 20)

  const hits: CravingHistoryHit[] = []

  for (const row of rows) {
    const parsed = JSON.parse(row.payloadJson) as unknown
    const payload = CravingDecodedPayloadSchema.parse(parsed)
    if (input.category && payload.category !== input.category) continue
    hits.push({ id: row.id, capturedAt: row.capturedAt, payload })
  }

  return hits
}

// Import at top of real file:
import { CravingDecodedPayloadSchema } from '@brioela/shared/validator/craving-decoder/craving.decoded.event.schema'
```

**Future:** Replace with FTS when `memory_event_fts` ships — keep same return shape.
