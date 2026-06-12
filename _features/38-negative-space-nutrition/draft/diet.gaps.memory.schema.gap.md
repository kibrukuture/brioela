# Draft: diet.gaps.memory.schema.ts (gap — file does not exist)

Target: `shared/validator/negative-space/diet.gaps.memory.schema.ts`

**Gap:** No Zod shape for `user_memory` namespace `diet.gaps` — downstream **34**/**24** read via injection.

**Source:** `build-guide/37-negative-space-nutrition/03-surfacing-and-memory.md`

---

```typescript
import { z } from 'zod'

export const dietGapMemoryStatusSchema = z.enum(['watching', 'closed'])

export const dietGapMemoryValueSchema = z.object({
  status: dietGapMemoryStatusSchema,
  reason: z.string().nullable(),
  closed_at: z.number().int().nullable(),
  gap_class: z.enum(['structural', 'displacement']).optional(),
  confirmed_at: z.number().int().optional(),
})

export type DietGapMemoryValue = z.infer<typeof dietGapMemoryValueSchema>

/** Namespace: diet.gaps — key = category (e.g. omega_3) */
export const DIET_GAPS_NAMESPACE = 'diet.gaps' as const
```
