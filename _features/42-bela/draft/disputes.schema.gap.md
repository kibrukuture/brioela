# Draft: dispute.schema.ts (gap — file does not exist)

Target: `shared/validator/bela/dispute.schema.ts`

**Source:** `implementable-specs/bela/12-dispute-resolution.md`

---

```typescript
import { z } from 'zod'

export const disputeTypeValues = [
	'wrong_item',
	'missing_item',
	'constraint_violation',
	'quality',
] as const

export const disputeStatusValues = [
	'open',
	'auto_resolved',
	'manual_review',
	'resolved',
	'rejected',
] as const

export const disputeSchema = z.object({
	disputeId: z.string().uuid(),
	orderId: z.string().uuid(),
	userId: z.string().min(1),
	disputeType: z.enum(disputeTypeValues),
	affectedItems: z.array(z.string().uuid()),
	userPhotoR2Url: z.string().url().nullable(),
	status: z.enum(disputeStatusValues),
	resolution: z.string().nullable(),
	refundAmountCents: z.number().int().nonnegative().nullable(),
	autoResolved: z.boolean(),
	openedAt: z.string().datetime(),
	resolvedAt: z.string().datetime().nullable(),
})
```
