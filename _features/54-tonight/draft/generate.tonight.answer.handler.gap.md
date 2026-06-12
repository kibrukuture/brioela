# Draft: generate.tonight.answer.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/tonight/generate.tonight.answer.handler.ts`

**Gap (feature 54):** ≤1 structured LLM call for headline/subline when not pure plan restatement.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § Technical Constraints

---

```typescript
import type { TonightContext } from '@/agents/brain/_helpers/tonight/assemble.tonight.context.helper'
import type { TonightGenerationOutput } from '@brioela/shared/validator/tonight/tonight.generation.output.schema'
import { buildTonightGenerationPrompt } from '@/agents/brain/_helpers/tonight/build.tonight.generation.prompt.helper'

export type GenerateTonightAnswerInput = {
  ctx: TonightContext
  recipeId: string
  recipeTitle: string
  minutes: number
  inventoryClaim: 'full' | 'single_pickup'
  pickupLabel?: string
  skipLlm: boolean
}

export async function generateTonightAnswer(
  input: GenerateTonightAnswerInput,
): Promise<TonightGenerationOutput> {
  if (input.skipLlm) {
    const headline =
      input.inventoryClaim === 'full'
        ? `Tonight: ${input.recipeTitle}. ${input.minutes} minutes. Everything's in your kitchen.`
        : `Tonight: ${input.recipeTitle} — if you grab ${input.pickupLabel} on the way home.`

    return { headline, subline: null }
  }

  const prompt = buildTonightGenerationPrompt(input)
  const result = await /* structuredLlmCall<TonightGenerationOutput> */ prompt

  return result
}
```
