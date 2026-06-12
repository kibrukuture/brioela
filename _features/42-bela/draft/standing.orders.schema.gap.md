# Draft: standing.order.schema.ts (gap — file does not exist)

Target: `shared/validator/bela/standing.order.schema.ts`

**Source:** `implementable-specs/bela/09-standing-order.md`

---

```typescript
import { z } from 'zod'

export const standingFrequencyValues = ['weekly', 'biweekly', 'monthly'] as const
export const standingOrderStatusValues = ['active', 'paused', 'cancelled'] as const
export const standingCycleStatusValues = [
	'proposed',
	'confirmed',
	'skipped',
	'dispatched',
	'completed',
] as const

export const standingOrderSchema = z.object({
	standingOrderId: z.string().uuid(),
	userId: z.string().min(1),
	recipientUserId: z.string().nullable(),
	recipientProfileId: z.string().nullable(),
	frequency: z.enum(standingFrequencyValues),
	dayOfWeek: z.number().int().min(0).max(6).nullable(),
	dayOfMonth: z.number().int().min(1).max(28).nullable(),
	deliveryWindowStartHour: z.number().int().min(0).max(23),
	deliveryWindowEndHour: z.number().int().min(0).max(23),
	budgetCapCents: z.number().int().positive().nullable(),
	autoConfirm: z.boolean(),
	status: z.enum(standingOrderStatusValues),
	nextCycleDate: z.string().date(),
})

export const standingOrderCycleSchema = z.object({
	cycleId: z.string().uuid(),
	standingOrderId: z.string().uuid(),
	orderId: z.string().uuid().nullable(),
	cycleDate: z.string().date(),
	status: z.enum(standingCycleStatusValues),
	proposedItemsJson: z.unknown(),
	confirmedItemsJson: z.unknown().nullable(),
	estimatedTotalCents: z.number().int().nonnegative().nullable(),
	autoConfirmed: z.boolean(),
})
```
