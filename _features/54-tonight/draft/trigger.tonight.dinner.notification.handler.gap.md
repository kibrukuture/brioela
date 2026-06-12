# Draft: trigger.tonight.dinner.notification.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/tonight/trigger.tonight.dinner.notification.handler.ts`

**Gap (feature 54):** Enqueue `tonight_dinner` medium notification.

**Source:** `_features/21-platform-notifications/spec.md` § Medium inventory

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'

export async function triggerTonightDinnerNotification(
  db: BrainDatabase,
  userId: string,
  answerId: string,
): Promise<void> {
  const answer = await db.run(/* select headline from tonight_answer */)

  await db.run(/* enqueueNotification **21** */ {
    userId,
    type: 'tonight_dinner',
    priority: 'medium',
    payload: {
      answerId,
      headline: answer.headline,
      deepLink: `brioela://tonight/${answerId}`,
    },
  })
}
```

**Boundary:** Send transport, quiet hours, suppression ledger — **21** only.
