import type { AppContext } from '@/index';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';
import Stripe from 'stripe';
import { handlePaymentFailed } from '@/core/webhooks/stripe/services/payment-failed.service';
import { handleSubscriptionUpdated } from '@/core/webhooks/stripe/services/subscription-updated.service';
import { handlePaymentSucceeded } from '@/core/webhooks/stripe/services/payment-succeeded.service';
import { handleSubscriptionCreated } from '@/core/webhooks/stripe/services/subscription-created.service';
import { handleCustomerDeleted } from '@/core/webhooks/stripe/services/customer-deleted.service';
import { getErrorMessage } from '@/lib/error-utils';

export async function handleStripeWebhook(c: AppContext) {
	try {
		const signature = c.req.header('stripe-signature');

		if (!signature) {
			return c.json(apiErrorResponse(ErrorCode.UNAUTHORIZED, 'Missing stripe signature'), 401);
		}

		const body = await c.req.text();
		const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

		// Verify webhook signature
		let event: Stripe.Event;
		try {
			event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_SECRET_WEBHOOK_KEY);
		} catch (err: unknown) {
			console.error('[Stripe Webhook] Signature verification failed:', getErrorMessage(err));
			return c.json(apiErrorResponse(ErrorCode.UNAUTHORIZED, 'Invalid signature'), 401);
		}

		console.log(`[Stripe Webhook] Received event: ${event.type}`);

		// Route to appropriate handler based on event type
		switch (event.type) {
			case 'invoice.payment_failed':
				return await handlePaymentFailed(c, event);

			case 'customer.subscription.updated':
				return await handleSubscriptionUpdated(c, event);

			case 'invoice.payment_succeeded':
				return await handlePaymentSucceeded(c, event);

			case 'customer.subscription.created':
				return await handleSubscriptionCreated(c, event);

			case 'customer.deleted':
				return await handleCustomerDeleted(c, event);

			default:
				console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
				return c.json(apiSuccessResponse({ message: 'Event received but not handled' }));
		}
	} catch (err: unknown) {
		console.error('[Stripe Webhook] Error processing webhook:', err);
		return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to process webhook'), 500);
	}
}
