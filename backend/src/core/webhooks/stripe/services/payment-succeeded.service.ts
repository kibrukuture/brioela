import type { AppContext } from '@/index';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import { SuperwallEventData } from '@/core/webhooks/superwall/types/superwall-events.types';
import { eq } from '@brioela/shared/drizzle';
import { users } from '@brioela/shared/drizzle/schema/user.schema';
import { getDb } from '@/core/database/client';
import Stripe from 'stripe';

export async function handlePaymentSucceeded(c: AppContext, event: Stripe.Event) {
	try {
		const invoice = event.data.object as Stripe.Invoice;
		const customerId = invoice.customer as string;
		const subscriptionId = invoice.lines.data[0].subscription as string;

		console.log(`[Stripe Webhook] Payment succeeded for customer: ${customerId}, subscription: ${subscriptionId}`);

		const db = getDb();

		// Find user by stripe customer ID
		const [user] = await db.select().from(users).where(eq(users.paymentCustomerId, customerId)).limit(1);

		if (!user) {
			console.error(`[Stripe Webhook] User not found for customer: ${customerId}`);
			return c.json(apiErrorResponse(ErrorCode.NOT_FOUND, 'User not found'), 404);
		}

		// Update user payment status and last paid date
		await db
			.update(users)
			.set({
				paymentStatus: 'active',
				lastPaid: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));

		console.log(`[Stripe Webhook] Updated user ${user.id} status to active`);

		return c.json(apiSuccessResponse({ message: 'Payment succeeded event processed' }));
	} catch (err: unknown) {
		console.error('[Stripe Webhook] Payment succeeded error:', err);
		return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to process payment succeeded event'), 500);
	}
}
