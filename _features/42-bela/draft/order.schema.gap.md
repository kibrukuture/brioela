# Draft: order.schema.ts (gap — file does not exist)

Target: `shared/validator/bela/order.schema.ts`

**Source:** `implementable-specs/bela/01-order-creation.md`, `13-data-model.md`

---

```typescript
import { z } from 'zod'

export const orderStatusValues = [
	'pending',
	'accepted',
	'shopping',
	'in_transit',
	'delivered',
	'completed',
	'disputed',
	'cancelled',
	'refunded',
] as const

export const orderSourceKindValues = [
	'direct',
	'standing_order',
	'cooking_intent',
	'recipe_save',
] as const

export const deliveryAddressSchema = z.object({
	street: z.string().min(1),
	neighborhood: z.string().optional(),
	city: z.string().min(1),
	lat: z.number(),
	lng: z.number(),
	contactPhone: z.string().optional(),
})

export const orderSchema = z.object({
	orderId: z.string().uuid(),
	userId: z.string().min(1),
	recipientUserId: z.string().nullable(),
	shopperId: z.string().uuid().nullable(),
	status: z.enum(orderStatusValues),
	city: z.string().min(1),
	deliveryAddress: deliveryAddressSchema,
	deliveryWindowStart: z.string().datetime(),
	deliveryWindowEnd: z.string().datetime(),
	estimatedTotalCents: z.number().int().nonnegative(),
	actualTotalCents: z.number().int().nonnegative().nullable(),
	serviceFeeCents: z.number().int().nonnegative().nullable(),
	stripePaymentIntentId: z.string().nullable(),
	authorizationAmountCents: z.number().int().nonnegative().nullable(),
	sourceKind: z.enum(orderSourceKindValues).nullable(),
	sourceRef: z.string().nullable(),
	deliveryPhotoR2Url: z.string().url().nullable(),
	createdAt: z.string().datetime(),
})

export type OrderStatus = (typeof orderStatusValues)[number]
export type Order = z.infer<typeof orderSchema>
```
