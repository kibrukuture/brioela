# Draft: store.tonight.answer.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/tonight/store.tonight.answer.handler.ts`

**Gap (feature 54):** Persist `tonight_answer` row.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § Data Model

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import type { TonightReasoningTag } from '@brioela/shared/constants/tonight'
import type { SingleItemPickup } from '@/agents/brain/_helpers/tonight/evaluate.single.item.pickup.helper'

export type StoreTonightAnswerInput = {
  userId: string
  dateLocal: string
  recipeId: string
  swapRecipeIds: [string, string]
  reasoningTags: TonightReasoningTag[]
  headline: string
  subline: string | null
  pickup?: SingleItemPickup
  document: BrioelaGenerativeUiDocument
  generatedAt: number
}

export async function storeTonightAnswer(
  db: BrainDatabase,
  input: StoreTonightAnswerInput,
): Promise<{ answerId: string }> {
  const answerId = `tonight:${input.userId}:${input.dateLocal}`

  await db.insert(/* tonight_answer */).values({
    answerId,
    userId: input.userId,
    dateLocal: input.dateLocal,
    recipeId: input.recipeId,
    swapRecipeIdsJson: JSON.stringify(input.swapRecipeIds),
    reasoningTagsJson: JSON.stringify(input.reasoningTags),
    headline: input.headline,
    subline: input.subline,
    pickupItemJson: input.pickup ? JSON.stringify(input.pickup) : null,
    documentJson: JSON.stringify(input.document),
    generatedAt: input.generatedAt,
  })

  return { answerId }
}
```
