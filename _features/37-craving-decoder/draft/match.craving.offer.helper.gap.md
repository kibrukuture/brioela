# Draft: match.craving.offer.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/craving-decoder/match.craving.offer.helper.ts`

**Gap:** No cause → offer mapping. Pantry/Tonight/Kin bodies live in neighbor features.

**Source:** `build-guide/39-craving-decoder/02-evidence-assembly.md`

---

```typescript
import type { CravingCauseSchema } from '@brioela/shared/validator/craving-decoder/craving.decoded.event.schema'
import type { z } from '@brioela/shared/zod'

type CravingCause = z.infer<typeof CravingCauseSchema>

export type CravingOfferType = 'pantry_bridge' | 'tonight_adjust' | 'flatter_alternative' | 'none'

export type CravingOffer = {
  type: CravingOfferType
  summary: string
  recipeId?: string
  productId?: string
}

export type MatchCravingOfferInput = {
  primaryCause: CravingCause
  pantryBridge?: { recipeTitle: string; recipeId: string; minutes: number }
  flatterProduct?: { productName: string; productId: string }
}

export function matchCravingOffer(input: MatchCravingOfferInput): CravingOffer {
  switch (input.primaryCause) {
    case 'eating_gap':
      if (input.pantryBridge) {
        return {
          type: 'pantry_bridge',
          summary: `Eat something real first — you have what you need for ${input.pantryBridge.recipeTitle}; want the ${input.pantryBridge.minutes}-minute version?`,
          recipeId: input.pantryBridge.recipeId,
        }
      }
      return {
        type: 'pantry_bridge',
        summary: 'Eat something real first — want me to suggest something quick from what you likely have at home?',
      }

    case 'short_sleep':
      return {
        type: 'tonight_adjust',
        summary: "Tonight's dinner could be early and light — want me to factor that in?",
      }

    case 'no_pattern':
      if (input.flatterProduct) {
        return {
          type: 'flatter_alternative',
          summary: `No pattern I can see — sometimes cravings are just cravings. Of the sweet things you buy, ${input.flatterProduct.productName} tends to be the flattest for you.`,
          productId: input.flatterProduct.productId,
        }
      }
      return {
        type: 'none',
        summary: 'No pattern I can see — sometimes chocolate is just chocolate.',
      }

    default:
      return { type: 'none', summary: '' }
  }
}
```

**Boundary:** Do not offer nutrient-gap filling language (**38**) — only temporal bridge / Tonight / flatter sweet.
