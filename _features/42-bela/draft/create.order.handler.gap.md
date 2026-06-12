# Draft: post.create.order.handler.ts (gap — file does not exist)

Target: `backend/src/api/bela/_handlers/post.create.order.handler.ts`

**Source:** `implementable-specs/bela/01-order-creation.md`, `03-constraint-travel.md`

---

```typescript
import type { Context } from 'hono'
import { z } from 'zod'
import { getBrainStub } from '@/agents/brain/get.brain.stub'
import { createOrderRows } from '../_helpers/create.order.rows.helper'
import { notifyNearbyShoppers } from '../_helpers/notify.nearby.shoppers.helper'

const createOrderBodySchema = z.object({
	items: z.array(
		z.object({
			description: z.string().min(1),
			quantity: z.string().min(1),
			productId: z.string().nullable(),
			userNote: z.string().nullable(),
		}),
	).min(1),
	deliveryAddress: z.object({
		street: z.string(),
		city: z.string(),
		lat: z.number(),
		lng: z.number(),
	}),
	deliveryWindowStart: z.string().datetime(),
	deliveryWindowEnd: z.string().datetime(),
	recipientUserId: z.string().nullable(),
	recipientProfileId: z.string().nullable(),
	sourceKind: z.enum(['direct', 'standing_order', 'cooking_intent', 'recipe_save']).optional(),
	sourceRef: z.string().nullable().optional(),
})

export async function postCreateOrderHandler(c: Context): Promise<Response> {
	const userId = c.get('userId') as string
	const body = createOrderBodySchema.parse(await c.req.json())

	const brain = getBrainStub(c.env, userId)
	const snapshotTargetUserId = body.recipientUserId ?? userId
	const snapshot = await brain.snapshotConstraintsForOrder({
		orderRecipientUserId: snapshotTargetUserId,
		recipientProfileId: body.recipientProfileId,
	})

	const order = await createOrderRows(c.env, {
		userId,
		...body,
		constraintSnapshot: snapshot,
		status: 'pending',
	})

	await notifyNearbyShoppers(c.env, order)

	return c.json({ orderId: order.orderId, status: 'pending' }, 201)
}
```
