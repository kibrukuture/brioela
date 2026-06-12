# Draft: post.shopper.register.bela.card.handler.ts (gap — file does not exist)

Target: `backend/src/api/bela/_handlers/post.shopper.register.bela.card.handler.ts`

**Source:** `implementable-specs/bela/15-checkout-payment.md`, `02-shopper-platform.md`

---

```typescript
import type { Context } from 'hono'
import Stripe from 'stripe'
import { z } from 'zod'

const bodySchema = z.object({
	setupIntentId: z.string().min(1),
})

export async function postShopperRegisterBelaCardHandler(c: Context): Promise<Response> {
	const userId = c.get('userId') as string
	const { setupIntentId } = bodySchema.parse(await c.req.json())
	const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })

	const intent = await stripe.setupIntents.retrieve(setupIntentId)
	if (intent.status !== 'succeeded' || !intent.payment_method) {
		return c.json({ error: 'setup_incomplete' }, 400)
	}

	const paymentMethodId =
		typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method.id

	const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
	if (pm.card?.last4 === undefined) {
		return c.json({ error: 'not_a_card' }, 400)
	}

	await c.env.SUPABASE.from('shoppers')
		.update({
			bela_card_payment_method_id: paymentMethodId,
			bela_card_last4: pm.card.last4,
			bela_card_brand: pm.card.brand,
			updated_at: new Date().toISOString(),
		})
		.eq('user_id', userId)

	return c.json({
		last4: pm.card.last4,
		brand: pm.card.brand,
		label: `Bela Shopping Card — ending ${pm.card.last4}`,
	})
}
```
