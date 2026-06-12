# Draft: deliver.tonight.card.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/tonight/deliver.tonight.card.handler.ts`

**Gap (feature 54):** Mark delivered + decide push vs in-app only.

**Source:** `build-guide/38-tonight/02-timing-and-delivery.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { learnTonightDeliveryTime } from '@/agents/brain/_helpers/tonight/learn.tonight.delivery.time.helper'
import { triggerTonightDinnerNotification } from '@/agents/brain/_handlers/tonight/trigger.tonight.dinner.notification.handler'

export type DeliverTonightCardResult =
  | { delivered: true; channel: 'in_app' | 'push' }
  | { delivered: false; reason: string }

export async function deliverTonightCard(
  db: BrainDatabase,
  userId: string,
  answerId: string,
  now: number,
): Promise<DeliverTonightCardResult> {
  const answer = await db.run(/* select tonight_answer by answerId */)
  if (!answer) {
    return { delivered: false, reason: 'answer_not_found' }
  }

  const timing = await learnTonightDeliveryTime(db, userId, now)

  // In-app always
  let channel: 'in_app' | 'push' = 'in_app'

  if (!timing.inColdStart) {
    const mediumSlot = await db.run(/* **21** tryAcquireMediumPushSlot(userId, date) */)
    if (mediumSlot.available) {
      await triggerTonightDinnerNotification(db, userId, answerId)
      channel = 'push'
    }
  }

  await db.run(/* update tonight_answer set delivered_at, delivery_channel */)

  return { delivered: true, channel }
}
```

**Rule:** Cold start = in-app only for two weeks. Medium slot competition with price alert → in-app only that day.
