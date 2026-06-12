# Draft: order.payment.event.schema.ts (gap — file does not exist)

Target: `shared/validator/bela/order.payment.event.schema.ts`

**Source:** `implementable-specs/bela/05-escrow-payment.md`

---

```typescript
import { z } from 'zod'

export const orderPaymentEventKindValues = [
	'authorization_placed',
	'authorization_incremented',
	'captured',
	'connect_transfer',
	'tip_charge',
	'tip_transfer',
	'authorization_released',
	'refund',
] as const

export const orderPaymentEventSchema = z.object({
	id: z.string().uuid(),
	orderId: z.string().uuid(),
	kind: z.enum(orderPaymentEventKindValues),
	amountCents: z.number().int(),
	currency: z.string().length(3),
	stripeRef: z.string().nullable(),
	createdAt: z.string().datetime(),
})
```
