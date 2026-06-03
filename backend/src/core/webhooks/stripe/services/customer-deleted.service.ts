import type { AppContext } from '@/index';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import { getDb } from '@/core/database/client';
import { eq } from '@brioela/shared/drizzle';
import { users } from '@brioela/shared/drizzle/schema';
import Stripe from 'stripe';

export async function handleCustomerDeleted(c: AppContext, event: Stripe.Event) {
	try {
		const customer = event.data.object as Stripe.Customer;
		const customerId = customer.id;

		console.log(`[Stripe Webhook] Customer deleted: ${customerId}`);

		const db = getDb();

		// Find user by stripe customer ID
		const [user] = await db.select().from(users).where(eq(users.paymentCustomerId, customerId)).limit(1);

		if (!user) {
			console.error(`[Stripe Webhook] User not found for customer: ${customerId}`);
			return c.json(apiErrorResponse(ErrorCode.NOT_FOUND, 'User not found'), 404);
		}

		// Update user subscription status to cancelled
		await db
			.update(users)
			.set({
				paymentStatus: 'cancelled',
				cancelledAt: new Date(),
				updatedAt: new Date(),
			})
			.where(eq(users.id, user.id));

		return c.json(apiSuccessResponse({ message: 'Customer deleted event processed' }));
	} catch (err: unknown) {
		console.error('[Stripe Webhook] Customer deleted error:', err);
		return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to process customer deleted event'), 500);
	}
}
