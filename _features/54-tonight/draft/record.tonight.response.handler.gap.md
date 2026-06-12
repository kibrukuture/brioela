# Draft: record.tonight.response.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/tonight/record.tonight.response.handler.ts`

**Gap (feature 54):** Record Cook / Swap / Dismiss + learning events.

**Source:** `build-guide/38-tonight/03-learning-loop.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import type { TonightResponse } from '@brioela/shared/constants/tonight'
import { writeTonightLearningEvent } from '@/agents/brain/_handlers/tonight/write.tonight.learning.event.handler'

export type RecordTonightResponseInput = {
  userId: string
  answerId: string
  response: TonightResponse
  swapChosenRecipeId?: string
}

export async function recordTonightResponse(
  db: BrainDatabase,
  input: RecordTonightResponseInput,
): Promise<void> {
  await db.run(/* update tonight_answer response, responded_at, swap_chosen_recipe_id */)

  await writeTonightLearningEvent(db, {
    userId: input.userId,
    answerId: input.answerId,
    response: input.response,
    swapChosenRecipeId: input.swapChosenRecipeId,
  })

  if (input.response === 'dismissed') {
    await db.run(/* **21** recordNotificationDismissal('tonight_dinner') — suppression ladder */)
  }
}
```
