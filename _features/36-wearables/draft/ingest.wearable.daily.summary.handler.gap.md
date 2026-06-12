# Draft: ingest.wearable.daily.summary.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/wearables/ingest.wearable.daily.summary.handler.ts`

**Gap:** Brain RPC — validates connection ownership, appends `health_captures`, routes `user_memory` mirrors.

**Source:** `build-guide/20-wearables/03-memory-routing.md`, **22** `health_captures`

---

```typescript
import type { WearableDailySummary } from '@brioela/shared/validator/wearables/wearable.daily.summary.schema'
import type { BrainSqlite } from '@/agents/brain/types'
import { readWearableConnectionById } from '@/agents/brain/_repositories/read.wearable.connection.by.id.repository'
import { writeHealthCapture } from '@/agents/brain/_repositories/write.health.capture.repository'
import { routeWearableMemory } from '@/agents/brain/_handlers/wearables/route.wearable.memory.helper'
import { writeWearableAuditEvent } from '@/agents/brain/_repositories/write.wearable.audit.event.repository'

type IngestInput = {
  userId: string
  summaries: WearableDailySummary[]
}

type IngestResult = {
  accepted: number
  rejected: Array<{ connectionId: string; localDate: string; reason: string }>
}

export async function ingestWearableDailySummaries(
  db: BrainSqlite,
  input: IngestInput,
): Promise<IngestResult> {
  const rejected: IngestResult['rejected'] = []
  let accepted = 0

  for (const summary of input.summaries) {
    const connection = await readWearableConnectionById(db, {
      userId: input.userId,
      connectionId: summary.connectionId,
    })

    if (!connection || connection.status !== 'connected') {
      rejected.push({
        connectionId: summary.connectionId,
        localDate: summary.localDate,
        reason: 'connection_not_active',
      })
      continue
    }

    if (connection.provider !== summary.provider) {
      rejected.push({
        connectionId: summary.connectionId,
        localDate: summary.localDate,
        reason: 'provider_mismatch',
      })
      continue
    }

    const capturedAt = Date.parse(`${summary.localDate}T12:00:00`)
    const captureId = `wearable:${summary.connectionId}:${summary.localDate}`

    await writeHealthCapture(db, {
      id: captureId,
      userId: input.userId,
      captureType: 'wearable_daily_summary',
      domain: 'wearable',
      metricKey: summary.localDate,
      valueJson: JSON.stringify(summary),
      sourceType: 'wearable',
      sourceDetail: summary.provider,
      sourceConnectionId: summary.connectionId,
      capturedAt,
      ingestedAt: Date.now(),
      confidence: 1,
      tags: JSON.stringify([summary.provider]),
      createdAt: Date.now(),
    })

    await routeWearableMemory(db, {
      userId: input.userId,
      summary,
      connection,
    })

    await writeWearableAuditEvent(db, {
      userId: input.userId,
      eventType: 'summary_ingested',
      connectionId: summary.connectionId,
      payloadJson: JSON.stringify({
        localDate: summary.localDate,
        provider: summary.provider,
      }),
    })

    accepted += 1
  }

  return { accepted, rejected }
}
```
