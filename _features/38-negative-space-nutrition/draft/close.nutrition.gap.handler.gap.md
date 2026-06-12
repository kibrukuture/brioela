# Draft: close.nutrition.gap.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/negative-space/close.nutrition.gap.handler.ts`

**Gap:** One-question-one-answer closure — permanent memory per spec **50**.

**Source:** `build-guide/37-negative-space-nutrition/03-surfacing-and-memory.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { eq } from 'drizzle-orm'
import { nutritionGap } from '@/agents/brain/_schemas/nutrition.gap.schema'
import { mirrorGapToMemory } from './write.diet.gaps.memory.handler'

export type GapUserAnswer = 'yes' | 'no' | 'covers_elsewhere' | 'supplement_mentioned'

export async function closeOrWatchNutritionGap(
  db: BrainSqlite,
  input: {
    userId: string
    gapId: string
    category: string
    gapClass: 'structural' | 'displacement'
    answer: GapUserAnswer
    userReasonText: string | null
    now: number
  },
): Promise<void> {
  if (input.answer === 'yes') {
    await db
      .update(nutritionGap)
      .set({ status: 'watching', updatedAt: input.now })
      .where(eq(nutritionGap.gapId, input.gapId))

    await mirrorGapToMemory(db, {
      userId: input.userId,
      category: input.category,
      gapClass: input.gapClass,
      status: 'watching',
      reason: null,
      closedAt: null,
      confirmedAt: input.now,
    })
    return
  }

  const closedReason =
    input.answer === 'no'
      ? 'user_declined'
      : input.answer === 'covers_elsewhere'
        ? 'user_covers_elsewhere'
        : 'user_covers_elsewhere' // supplement mention — never recommend supplements

  await db
    .update(nutritionGap)
    .set({
      status: 'closed',
      closedReason,
      updatedAt: input.now,
    })
    .where(eq(nutritionGap.gapId, input.gapId))

  await mirrorGapToMemory(db, {
    userId: input.userId,
    category: input.category,
    gapClass: input.gapClass,
    status: 'closed',
    reason: input.userReasonText ?? closedReason,
    closedAt: input.now,
  })
}
```

**Rule:** Closed is closed — never re-litigate even if absence persists in data.
