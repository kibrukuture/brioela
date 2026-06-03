import type { AppContext } from '@/index';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import { getDb } from '@/core/database/client';
import { eq } from '@brioela/shared/drizzle';
import { users } from '@brioela/shared/drizzle/schema';
import Stripe from 'stripe';

export async function handlePaymentFailed(c: AppContext, event: Stripe.Event) {
	try {
		const invoice = event.data.object as Stripe.Invoice;
		const customerId = invoice.customer as string;
		const attemptCount = invoice.attempt_count;

		console.log(`[Stripe Webhook] Payment failed for customer: ${customerId}, attempt: ${attemptCount}`);

		const db = getDb();

		// Find user by stripe customer ID
		const [user] = await db.select().from(users).where(eq(users.paymentCustomerId, customerId)).limit(1);

		if (!user) {
			console.error(`[Stripe Webhook] User not found for customer: ${customerId}`);
			return c.json(apiErrorResponse(ErrorCode.NOT_FOUND, 'User not found'), 404);
		}

		// Update user payment status
		await db
			.update(users)
			.set({
				paymentStatus: 'past_due',
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));

		// TODO: Send email notification to user about failed payment
		// await sendPaymentFailedEmail(user.email, attemptCount);

		console.log(`[Stripe Webhook] Updated user ${user.id} status to past_due`);

		return c.json(apiSuccessResponse({ message: 'Payment failed event processed' }));
	} catch (err: unknown) {
		console.error('[Stripe Webhook] Payment failed error:', err);
		return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to process payment failed event'), 500);
	}
}
