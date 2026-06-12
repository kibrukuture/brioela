# Draft: write.diet.gaps.memory.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/negative-space/write.diet.gaps.memory.handler.ts`

**Gap:** Mirror `nutrition_gap` state to `user_memory` `diet.gaps` for downstream **34**/**24** injection.

**Source:** `build-guide/37-negative-space-nutrition/03-surfacing-and-memory.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import {
  DIET_GAPS_NAMESPACE,
  type DietGapMemoryValue,
} from '@shared/validator/negative-space/diet.gaps.memory.schema'
import { writeUserMemory } from '@/agents/brain/_handlers/write.user.memory.handler'

export async function writeDietGapsMemory(
  db: BrainSqlite,
  input: {
    userId: string
    category: string
    value: DietGapMemoryValue
  },
): Promise<void> {
  await writeUserMemory(db, {
    userId: input.userId,
    namespace: DIET_GAPS_NAMESPACE,
    key: input.category,
    value: input.value,
  })
}

export async function mirrorGapToMemory(
  db: BrainSqlite,
  input: {
    userId: string
    category: string
    gapClass: 'structural' | 'displacement'
    status: 'watching' | 'closed'
    reason: string | null
    closedAt: number | null
    confirmedAt?: number
  },
): Promise<void> {
  await writeDietGapsMemory(db, {
    userId: input.userId,
    category: input.category,
    value: {
      status: input.status,
      reason: input.reason,
      closed_at: input.closedAt,
      gap_class: input.gapClass,
      confirmed_at: input.confirmedAt,
    },
  })
}
```

**Integration rule:** Plan (**34**) and scanner (**24**) read `diet.gaps` only — never `nutrition_gap` directly.
