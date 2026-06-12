# Draft: tonight.ambient.card.screen.tsx (gap — file does not exist)

Target: `mobile/features/tonight/screens/tonight.ambient.card.screen.tsx`

**Gap (feature 54):** In-app ambient card surface.

**Source:** `build-guide/38-tonight/02-timing-and-delivery.md`

---

```tsx
import { View } from 'react-native'
import { useTonightAnswer } from '@/features/tonight/hooks/use.tonight.answer'
import { GenerativeUiRenderer } from '@/grammar/GenerativeUiRenderer'
import { TonightCardActions } from '@/features/tonight/components/tonight.card.actions'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { recordTonightResponse } from '@/network/tonight/tonight.api'

export function TonightAmbientCardScreen() {
  const { answer, isLoading } = useTonightAnswer()

  useIsomorphicLayoutEffect(() => {
    if (answer?.answerId) {
      void recordTonightResponse({ answerId: answer.answerId, response: 'opened' })
    }
  }, [answer?.answerId])

  if (isLoading || !answer) {
    return null
  }

  return (
    <View accessibilityRole="summary">
      <GenerativeUiRenderer
        document={answer.document}
        fallback={<TonightCardStaticFallback headline={answer.headline} subline={answer.subline} />}
      />
      <TonightCardActions
        answerId={answer.answerId}
        recipeId={answer.recipeId}
        swapRecipeIds={answer.swapRecipeIds}
      />
    </View>
  )
}

function TonightCardStaticFallback(props: { headline: string; subline: string | null }) {
  return (
    <View>
      {/* Tier-0 static fallback per **52** doctrine */}
    </View>
  )
}
```

**Boundary:** Renderer from **52** `mobile/grammar/`. No share button — spec **51** forbids share on Tonight.
