# Draft: write-intervention-event.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/write-intervention-event.handler.ts`

**Gap:** No Brain handler to persist derived intervention events.

**Source:** `brioela-specs/46-acoustic-cooking-intelligence.md` Data Model, `build-guide/33-acoustic-cooking/03-intervention-events.md`

---

```typescript
import { writeInterventionEventInputSchema } from '@brioela/shared/validator/acoustic-cooking/evidence.source.schema'
import type { BrainHandlerContext } from '@/agents/brain/_handlers/brain.handler.context'
import { visionEvent } from '@/agents/brain/_schemas/vision.event.schema'

export async function writeInterventionEventHandler(
  ctx: BrainHandlerContext,
  rawInput: unknown,
): Promise<{ eventId: string }> {
  const input = writeInterventionEventInputSchema.parse(rawInput)
  const eventId = crypto.randomUUID()
  const now = Date.now()

  await ctx.db.insert(visionEvent).values({
    eventId,
    sessionId: input.sessionId,
    userId: ctx.userId,
    eventType: input.eventType,
    confidence: input.confidence,
    evidenceSource: input.evidenceSource,
    recipeStepOrder: input.recipeStepOrder ?? null,
    createdAt: now,
  })

  return { eventId }
}
```
