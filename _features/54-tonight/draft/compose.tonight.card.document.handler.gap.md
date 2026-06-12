# Draft: compose.tonight.card.document.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/tonight/compose.tonight.card.document.handler.ts`

**Gap (feature 54):** Generative grammar `ambient_surface` card document.

**Source:** `build-guide/38-tonight/02-timing-and-delivery.md`, `build-guide/27-generative-grammar/03-primitive-families.md`

---

```typescript
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import type { TonightReasoningTag } from '@brioela/shared/constants/tonight'
import { buildTonightCardGrammarPrompt } from '@/agents/brain/_helpers/tonight/build.tonight.card.grammar.prompt.helper'

export type ComposeTonightCardInput = {
  headline: string
  subline: string | null
  recipeId: string
  swapRecipeIds: [string, string]
  reasoningTags: TonightReasoningTag[]
  minutes: number
}

export async function composeTonightCardDocument(
  input: ComposeTonightCardInput,
): Promise<BrioelaGenerativeUiDocument> {
  const prompt = buildTonightCardGrammarPrompt(input)
  const document = await /* structuredLlmCall<BrioelaGenerativeUiDocument> */ prompt

  return {
    ...document,
    grammarVersion: '1',
    surface: 'tonight_daily_card_brioela_generative_ui',
    layoutTemplate: document.layoutTemplate ?? 'tonight_daily_card_stack_layout',
    safetyLock: true,
    nodes: document.nodes ?? [
      { type: 'ambient_surface', children: [
        { type: 'headline', text: input.headline },
        ...(input.subline ? [{ type: 'caption', text: input.subline }] : []),
      ]},
    ],
  }
}
```

**Boundary:** Renderer + validation owned by **52**. Register `tonight_daily_card_brioela_generative_ui` in `GenerativeSurface` enum before shipping.
