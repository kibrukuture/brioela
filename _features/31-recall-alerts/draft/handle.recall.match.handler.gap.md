# Gap snapshot: handle.recall.match.handler.ts

Target: `backend/src/agents/brain/_handlers/recall/handle.recall.match.handler.ts`

**Status:** Not in repo. Path B Brain HTTP — `build-guide/15-recall-alerts/03-critical-notification.md`.

**Delivery:** Calls **21** `send-push` when shipped; critical bypasses quiet hours + suppression.

---

```typescript
import { eq } from 'drizzle-orm'
import type { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'
import { BrainRecallMatchPayloadSchema } from '@shared/validator/recall/recall.alert.schema'
import { recallScanMatches } from '@shared/drizzle/schema/recall.schema'
import { buildRecallPushPayload } from '../_helpers/build.recall.push.payload.helper'

export async function handleRecallMatch(
  brain: BrioelaBrain,
  rawBody: unknown,
): Promise<{ delivered: boolean }> {
  const payload = BrainRecallMatchPayloadSchema.parse(rawBody)

  if (payload.matchConfidence === 'informational') {
    return { delivered: false }
  }

  const pushPayload = buildRecallPushPayload(payload)

  const delivered = await brain.tools.sendPush({
    type: pushPayload.type,
    priority: 'critical',
    title: pushPayload.title,
    body: pushPayload.body,
    data: {
      type: pushPayload.type,
      screen: 'recall_detail',
      match_id: payload.matchId,
    },
    idempotency_key: payload.idempotencyKey,
    collapse_id: `recall:${payload.recallEntryId}:${payload.userId}`,
  })

  if (delivered) {
    await brain.db
      .update(recallScanMatches)
      .set({ notifiedAt: new Date() })
      .where(eq(recallScanMatches.id, payload.matchId))
      .run()
  }

  return { delivered }
}
```

```typescript
// backend/src/agents/brain/_helpers/build.recall.push.payload.helper.ts

import type { BrainRecallMatchPayload } from '@shared/validator/recall/recall.alert.schema'

export function buildRecallPushPayload(payload: BrainRecallMatchPayload): {
  type: 'recall_alert_confirmed' | 'recall_alert_probable'
  title: string
  body: string
} {
  const title = `Recall: ${payload.productName}`
  const dateSuffix = payload.scannedAt
    ? ` you scanned on ${formatShortDate(payload.scannedAt)}`
    : ''

  if (payload.matchConfidence === 'confirmed') {
    return {
      type: 'recall_alert_confirmed',
      title,
      body: `A product${dateSuffix} has been recalled for ${payload.reason}. Check your fridge.`,
    }
  }

  return {
    type: 'recall_alert_probable',
    title,
    body: `You may have a recalled product${dateSuffix}. Check your fridge.`,
  }
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
```

**Optional:** Open `background` session with `sessions.alarm_type = 'recall_check'` per `07-sessions.md` — audit only; not required for push.
