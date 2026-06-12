# Draft: learn-sound-cue-from-session.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/learn-sound-cue-from-session.handler.ts`

**Gap:** No post-session learned `sound_cue` writeback after acoustic `step_confirmed`.

**Source:** `build-guide/33-acoustic-cooking/02-sound-cues-schema.md` § Learned from sessions

---

```typescript
import { z } from '@brioela/shared/zod'
import type { BrainHandlerContext } from '@/agents/brain/_handlers/brain.handler.context'
import type { NormalizedRecipeContent } from '@/agents/brain/_schemas/normalized.recipe.content.schema'

const learnSoundCueInputSchema = z.object({
  recipeId: z.string().uuid(),
  stepOrder: z.number().int().positive(),
  soundCue: z.string().min(1).max(500),
})

export async function learnSoundCueFromSessionHandler(
  ctx: BrainHandlerContext,
  rawInput: unknown,
): Promise<{ updated: boolean }> {
  const input = learnSoundCueInputSchema.parse(rawInput)
  const recipe = await ctx.recipeRepository.getById(ctx.userId, input.recipeId)
  if (!recipe) {
    return { updated: false }
  }

  const content = recipe.contentJson as NormalizedRecipeContent
  const stepIndex = content.steps.findIndex((s) => s.order === input.stepOrder)
  if (stepIndex < 0) {
    return { updated: false }
  }

  const existingCue = content.steps[stepIndex]?.soundCue
  if (existingCue && existingCue.trim().length > 0) {
    return { updated: false }
  }

  const nextSteps = content.steps.map((step, index) =>
    index === stepIndex ? { ...step, soundCue: input.soundCue } : step,
  )

  await ctx.recipeRepository.updateContent(ctx.userId, input.recipeId, {
    ...content,
    steps: nextSteps,
  })

  return { updated: true }
}
```
