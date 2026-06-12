# Draft: evaluate.single.item.pickup.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/tonight/evaluate.single.item.pickup.helper.ts`

**Gap (feature 54):** Honesty fallback — one pickup item max.

**Source:** `brioela-specs/51-tonight-dinner-answer.md` § The Answer Selection

---

```typescript
export type SingleItemPickup = {
  itemLabel: string
  itemKey: string
}

export type EvaluatePickupInput = {
  recipeId: string
  missingItemKeys: string[]
}

export type EvaluatePickupResult =
  | { mode: 'covered' }
  | { mode: 'single_pickup'; pickup: SingleItemPickup }
  | { mode: 'no_answer' }

export function evaluateSingleItemPickup(
  input: EvaluatePickupInput,
): EvaluatePickupResult {
  if (input.missingItemKeys.length === 0) {
    return { mode: 'covered' }
  }

  if (input.missingItemKeys.length === 1) {
    return {
      mode: 'single_pickup',
      pickup: {
        itemKey: input.missingItemKeys[0],
        itemLabel: input.missingItemKeys[0],
      },
    }
  }

  // Shopping trip is the meal plan's job — no card
  return { mode: 'no_answer' }
}
```
