# Draft: post.wearable.daily.summary.handler.ts (gap — file does not exist)

Target: `backend/src/api/wearables/_handlers/post.wearable.daily.summary.handler.ts`

**Source:** `build-guide/20-wearables/02-client-aggregation.md`

---

```typescript
import type { Context } from 'hono'
import {
  wearableDailySummaryRequestSchema,
  type WearableDailySummary,
} from '@brioela/shared/validator/wearables/wearable.daily.summary.schema'
import { getBrainStubForUser } from '@/agents/brain/get.brain.stub.for.user'
import { validateWearableSummaryFields } from '../_helpers/validate.wearable.summary.fields.helper'

type RejectedSummary = {
  connectionId: string
  localDate: string
  reason: string
}

export async function postWearableDailySummaryHandler(c: Context) {
  const userId = c.get('userId') as string
  const body = wearableDailySummaryRequestSchema.safeParse(await c.req.json())
  if (!body.success) {
    return c.json({ error: 'invalid_request', details: body.error.flatten() }, 400)
  }

  const accepted: WearableDailySummary[] = []
  const rejected: RejectedSummary[] = []

  for (const summary of body.data.summaries) {
    const fieldCheck = validateWearableSummaryFields(summary)
    if (!fieldCheck.ok) {
      rejected.push({
        connectionId: summary.connectionId,
        localDate: summary.localDate,
        reason: fieldCheck.reason,
      })
      continue
    }
    accepted.push(summary)
  }

  if (accepted.length === 0) {
    return c.json({ accepted: 0, rejected }, 422)
  }

  const brain = getBrainStubForUser(userId)
  const result = await brain.ingestWearableDailySummaries({ summaries: accepted })

  return c.json({
    accepted: result.accepted,
    rejected: [...rejected, ...result.rejected],
  })
}
```
