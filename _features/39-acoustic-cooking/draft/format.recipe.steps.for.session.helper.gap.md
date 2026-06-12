# Draft: format-recipe-steps-for-session.helper.ts (gap — file does not exist)

Target: `backend/src/agents/mira/_helpers/format-recipe-steps-for-session.helper.ts`

**Gap:** Session recipe payload does not surface `sound_cue` to Gemini setup.

**Source:** `build-guide/33-acoustic-cooking/02-sound-cues-schema.md` § Injection

---

```typescript
import type { NormalizedRecipeContent } from '@/agents/brain/_schemas/normalized.recipe.content.schema'

export type SessionRecipeStep = {
  order: number
  instruction: string
  durationMinutes: number | null
  temperatureText: string | null
  soundCue: string | null
}

export function formatRecipeStepsForSession(
  content: NormalizedRecipeContent,
): SessionRecipeStep[] {
  return content.steps.map((step) => ({
    order: step.order,
    instruction: step.instruction,
    durationMinutes: step.durationMinutes,
    temperatureText: step.temperatureText,
    soundCue: step.soundCue ?? null,
  }))
}

export function formatRecipeStepsForPrompt(steps: SessionRecipeStep[]): string {
  return steps
    .map((step) => {
      const cueLine = step.soundCue
        ? `\n  Sound cue: ${step.soundCue}`
        : ''
      return `Step ${step.order}: ${step.instruction}${cueLine}`
    })
    .join('\n\n')
}
```
