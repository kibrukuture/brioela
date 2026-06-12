# Draft: run.find.to.cooking.trigger.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/run.find.to.cooking.trigger.helper.ts`

**Gap (feature 35):** Second release — **27** Find matches `ingredient_not_found` gap → rare ambient card.

**Source:** `build-guide/09-ground/06-find-to-cooking-trigger.md`, `_features/27-ground/draft/match.find.to.cooking.gap.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'

export type FindToCookingInput = {
  userId: string
  findId: string
  ingredientLabel: string
  distanceMeters: number
  memoryEventId: string | null
}

const MAX_DISTANCE_METERS = 500
const MIN_CONFIDENCE = 0.8

export async function evaluateFindToCookingTrigger(
  database: BrainDatabase,
  input: FindToCookingInput,
): Promise<{ trigger: boolean; candidateCopy: string | null }> {
  if (input.distanceMeters > MAX_DISTANCE_METERS) {
    return { trigger: false, candidateCopy: null }
  }

  // TODO(05): verify ingredient_not_found memory_event recent + matches find
  // TODO(29): optional recent cooking intent / recipe memory
  // TODO: suppression — rare; not marketing

  const candidateCopy = `Fresh ${input.ingredientLabel} spotted ${input.distanceMeters}m away. Want to grab it and cook tonight?`

  // TODO: insert ambient_candidate kind find_to_cooking if confidence >= MIN_CONFIDENCE

  return { trigger: false, candidateCopy }
}
```

Find does not write memory by default; user action may create memory.
