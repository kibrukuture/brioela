# Draft: tonight.card.actions.tsx (gap — file does not exist)

Target: `mobile/features/tonight/components/tonight.card.actions.tsx`

**Gap (feature 54):** Cook / Swap / Not tonight gestures.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § User Outcome

---

```tsx
import { Pressable, Text, View } from 'react-native'
import { useTonightResponse } from '@/features/tonight/hooks/use.tonight.response'
import { useUserEntitlement } from '@/features/tiers/hooks/use.user.entitlement'
import { BrioelaTier } from '@brioela/shared/constants/tiers'
import { startCookingSession } from '@/features/cooking-session/start.cooking.session'
import { openRecipeView } from '@/features/recipes/open.recipe.view'
import { TonightSwapSheet } from '@/features/tonight/components/tonight.swap.sheet'

type Props = {
  answerId: string
  recipeId: string
  swapRecipeIds: [string, string]
}

export function TonightCardActions({ answerId, recipeId, swapRecipeIds }: Props) {
  const { record } = useTonightResponse()
  const entitlement = useUserEntitlement()
  const voiceAllowed = entitlement.tierRank >= /* Culina */ 2

  const onCookIt = async () => {
    await record({ answerId, response: 'cooked' })
    if (voiceAllowed) {
      await startCookingSession({ recipeId, source: 'tonight', preloadMira: true })
    } else {
      await openRecipeView(recipeId)
    }
  }

  const onNotTonight = async () => {
    await record({ answerId, response: 'dismissed' })
  }

  return (
    <View>
      <Pressable onPress={onCookIt} accessibilityRole="button">
        <Text>Cook it</Text>
      </Pressable>
      <TonightSwapSheet
        answerId={answerId}
        swapRecipeIds={swapRecipeIds}
        onSwapChosen={(swapId) => record({ answerId, response: 'swapped', swapChosenRecipeId: swapId })}
      />
      <Pressable onPress={onNotTonight} accessibilityRole="button">
        <Text>Not tonight</Text>
      </Pressable>
    </View>
  )
}
```

**Tier rule:** Luma → recipe view; Culina+ → Mira voice session (**43**/**29**).
