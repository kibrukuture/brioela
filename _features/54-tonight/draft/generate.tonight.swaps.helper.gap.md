# Draft: generate.tonight.swaps.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/generate.tonight.swaps.helper.ts`

**Gap (feature 54):** Exactly two pre-computed swaps.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § User Outcome

---

```typescript
import type { RankedTonightRecipe } from '@/agents/brain/_helpers/tonight/rank.tonight.recipe.pool.helper'

const REQUIRED_SWAP_COUNT = 2

export type TonightSwapPair = [string, string]

export function generateTonightSwaps(
  primaryRecipeId: string,
  ranked: RankedTonightRecipe[],
): TonightSwapPair | null {
  const candidates = ranked
    .filter((r) => r.recipeId !== primaryRecipeId)
    .slice(0, REQUIRED_SWAP_COUNT + 2)

  const swaps = candidates
    .filter((r) => r.score > 0)
    .slice(0, REQUIRED_SWAP_COUNT)
    .map((r) => r.recipeId)

  if (swaps.length < REQUIRED_SWAP_COUNT) {
    return null
  }

  return [swaps[0], swaps[1]]
}
```

**Rule:** Never return more than two swap ids. UI must never show a browse list.
