# Draft: order.constraint.snapshot.schema.ts (gap — file does not exist)

Target: `shared/validator/bela/order.constraint.snapshot.schema.ts`

**Gap:** No Zod schema for frozen order constraint snapshot.

**Source:** `implementable-specs/bela/03-constraint-travel.md`

---

```typescript
import { z } from 'zod'

export const constraintBlockKindValues = ['allergy', 'intolerance', 'boycott'] as const
export const softGuidanceKindValues = ['dislike', 'preference'] as const
export const constraintEntityKindValues = ['ingredient', 'brand', 'place', 'attribute'] as const

export const hardBlockSchema = z.object({
	kind: z.enum(constraintBlockKindValues),
	entityKind: z.enum(['ingredient', 'brand', 'place']),
	entityValue: z.string().min(1),
	reason: z.string().min(1),
})

export const softGuidanceSchema = z.object({
	kind: z.enum(softGuidanceKindValues),
	entityKind: z.enum(constraintEntityKindValues),
	entityValue: z.string().min(1),
	instruction: z.string().min(1),
})

export const orderConstraintSnapshotSchema = z.object({
	orderId: z.string().uuid(),
	capturedAt: z.number().int().nonnegative(),
	hardBlocks: z.array(hardBlockSchema),
	softGuidance: z.array(softGuidanceSchema),
})

export type HardBlock = z.infer<typeof hardBlockSchema>
export type SoftGuidance = z.infer<typeof softGuidanceSchema>
export type OrderConstraintSnapshot = z.infer<typeof orderConstraintSnapshotSchema>
```
