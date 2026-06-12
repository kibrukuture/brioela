# Draft: order.item.schema.ts (gap — file does not exist)

Target: `shared/validator/bela/order.item.schema.ts`

**Source:** `implementable-specs/bela/13-data-model.md`

---

```typescript
import { z } from 'zod'

export const orderItemStatusValues = [
	'pending',
	'found',
	'substituted',
	'unavailable',
	'blocked',
] as const

export const itemConfidenceValues = ['exact_match', 'best_match', 'open_description'] as const

export const orderItemSchema = z.object({
	itemId: z.string().uuid(),
	orderId: z.string().uuid(),
	productId: z.string().nullable(),
	description: z.string().min(1),
	quantity: z.string().min(1),
	userNote: z.string().nullable(),
	confidence: z.enum(itemConfidenceValues),
	status: z.enum(orderItemStatusValues),
	scannedProductId: z.string().nullable(),
	actualPriceCents: z.number().int().nonnegative().nullable(),
	substitution: z.boolean(),
	substitutionApprovedBy: z.enum(['user', 'auto_timeout']).nullable(),
})

export type OrderItem = z.infer<typeof orderItemSchema>
```
