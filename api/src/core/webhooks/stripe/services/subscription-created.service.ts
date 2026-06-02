import type { AppContext } from '@/index';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';
import { getDb } from '@/core/database/client';
import { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema';
import Stripe from 'stripe';

export async function handleSubscriptionCreated(c: AppContext, event: Stripe.Event) {
	try {
		const subscription = event.data.object as Stripe.Subscription;
		const customerId = subscription.customer as string;
		const status = subscription.status;

		console.log(`[Stripe Webhook] Subscription created for customer: ${customerId}, status: ${status}`);

		const db = getDb();

		// Find user by stripe customer ID
		const [user] = await db.select().from(users).where(eq(users.paymentCustomerId, customerId)).limit(1);

		if (!user) {
			console.error(`[Stripe Webhook] User not found for customer: ${customerId}`);
			return c.json(apiErrorResponse(ErrorCode.NOT_FOUND, 'User not found'), 404);
		}

		// Map Stripe status to our payment status
		let paymentStatus: 'active' | 'cancelled' | 'past_due' | 'expired' | 'incomplete' | 'trialing' | 'paused' | null;

		switch (status) {
			case 'active':
				paymentStatus = 'active';
				break;
			case 'canceled':
				paymentStatus = 'cancelled';
				break;
			case 'past_due':
			case 'unpaid':
				paymentStatus = 'past_due';
				break;
			case 'incomplete':
			case 'incomplete_expired':
				paymentStatus = 'expired';
				break;
			case 'trialing':
				paymentStatus = 'trialing';
				break;
			case 'paused':
				paymentStatus = 'paused';
				break;
			default:
				console.warn(`[Stripe Webhook] Unknown status: ${status}, setting to null`);
				paymentStatus = null;
		}

		// Update user subscription status
		await db
			.update(users)
			.set({
				paymentStatus,
				paymentSubscriptionId: subscription.id,
				subscriptionEndDate: null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));

		console.log(`[Stripe Webhook] Updated user ${user.id} subscription status to ${paymentStatus}`);

		return c.json(apiSuccessResponse({ message: 'Subscription created event processed' }));
	} catch (err: unknown) {
		console.error('[Stripe Webhook] Subscription created error:', err);
		return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to process subscription created event'), 500);
	}
}
