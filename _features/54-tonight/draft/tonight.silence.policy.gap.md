# Draft: tonight.silence.policy.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_policies/tonight/tonight.silence.policy.ts`

**Gap (feature 54):** Enforce silence-over-filler.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § The Answer Selection

---

```typescript
import type { EvaluatePickupResult } from '@/agents/brain/_helpers/tonight/evaluate.single.item.pickup.helper'
import type { TonightSwapPair } from '@/agents/brain/_helpers/tonight/generate.tonight.swaps.helper'

export type SilencePolicyInput = {
  primaryRecipeId: string | null
  swaps: TonightSwapPair | null
  pickup: EvaluatePickupResult
  poolSize: number
}

export type SilencePolicyResult =
  | { shouldGenerate: true }
  | { shouldGenerate: false; reason: string }

export function decideTonightSilence(input: SilencePolicyInput): SilencePolicyResult {
  if (!input.primaryRecipeId) {
    return { shouldGenerate: false, reason: 'no_primary_recipe' }
  }

  if (input.poolSize === 0) {
    return { shouldGenerate: false, reason: 'empty_pool' }
  }

  if (input.pickup.mode === 'no_answer') {
    return { shouldGenerate: false, reason: 'coverage_too_thin' }
  }

  if (!input.swaps && input.pickup.mode !== 'single_pickup') {
    return { shouldGenerate: false, reason: 'insufficient_swaps' }
  }

  return { shouldGenerate: true }
}
```
