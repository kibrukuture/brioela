import { SuperwallEventData } from '@/core/webhooks/superwall/types/superwall-events.types';
import drizzle, { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';

export async function handlePaymentSucceeded(event: SuperwallEventData, db: ReturnType<typeof drizzle>) {
	const { originalAppUserId, price, proceeds, transactionId, purchasedAt } = event;

	if (!originalAppUserId) {
		return { processed: false, reason: 'no_user_id' };
	}

	try {
		await db
			.update(users)
			.set({
				paymentStatus: 'active',
				lastPaid: new Date(purchasedAt),
				paymentAmountTotal: proceeds.toString(),
				paymentMetadata: JSON.stringify(event),
				updatedAt: new Date(),
			})
			.where(eq(users.id, originalAppUserId));

		console.log(`✅ Payment succeeded for user: ${originalAppUserId}, amount: ${price}`);

		return { processed: true, userId: originalAppUserId };
	} catch (error) {
		console.error('Error handling payment succeeded:', error);
		throw error;
	}
}
