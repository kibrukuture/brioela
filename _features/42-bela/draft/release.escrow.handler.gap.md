# Draft: capture.and.transfer.helper.ts (gap — file does not exist)

Target: `backend/src/agents/bela/_helpers/capture.and.transfer.helper.ts`

**Source:** `implementable-specs/bela/05-escrow-payment.md`

---

```typescript
import Stripe from 'stripe'
import { appendPaymentEvent } from './append.payment.event.helper'

export type CaptureAndTransferInput = {
	orderId: string
	paymentIntentId: string
	captureAmountCents: number
	shopperConnectAccountId: string
	shopperPayoutCents: number
	currency: string
}

export async function captureAndTransferShopper(
	env: Env,
	stripe: Stripe,
	input: CaptureAndTransferInput,
): Promise<{ captureId: string; transferId: string }> {
	const captured = await stripe.paymentIntents.capture(input.paymentIntentId, {
		amount_to_capture: input.captureAmountCents,
	})

	await appendPaymentEvent(env, {
		orderId: input.orderId,
		kind: 'captured',
		amountCents: input.captureAmountCents,
		currency: input.currency,
		stripeRef: captured.id,
	})

	const transfer = await stripe.transfers.create({
		amount: input.shopperPayoutCents,
		currency: input.currency,
		destination: input.shopperConnectAccountId,
		metadata: { order_id: input.orderId },
	})

	await appendPaymentEvent(env, {
		orderId: input.orderId,
		kind: 'connect_transfer',
		amountCents: input.shopperPayoutCents,
		currency: input.currency,
		stripeRef: transfer.id,
	})

	return { captureId: captured.id, transferId: transfer.id }
}
```
