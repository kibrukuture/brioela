# Draft: apply.craving.tonight.adjustment.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/tonight/apply.craving.tonight.adjustment.handler.ts`

**Gap (feature 54):** Execute **37** `tonight_adjust` accept.

**Source:** `_features/37-craving-decoder/draft/match.craving.offer.helper.gap.md`, spec **52**

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'

export type ApplyCravingTonightAdjustmentInput = {
  userId: string
  dateLocal: string
  cravingDecodedEventId: string
}

export async function applyCravingTonightAdjustment(
  db: BrainDatabase,
  input: ApplyCravingTonightAdjustmentInput,
): Promise<{ applied: true }> {
  await db.run(/* upsert tonight_delivery_preference */ {
    userId: input.userId,
    cravingAdjustUntilLocal: input.dateLocal,
    updatedAt: Date.now(),
  })

  // If today's answer not yet generated, next runTonightGeneration biases early/light
  // If already generated, optionally regenerate once (product rule TBD at implementation)

  await db.run(/* appendMemoryEvent craving_tonight_adjust_accepted */)

  return { applied: true }
}
```

**Boundary:** Offer phrase lives in **37** `matchCravingOffer`. This handler only executes the preference flag.
