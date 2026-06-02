import { SuperwallEventData } from '@/core/webhooks/superwall/types/superwall-events.types';
import drizzle, { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';

export async function handlePaymentFailed(event: SuperwallEventData, db: ReturnType<typeof drizzle>) {
	const { originalAppUserId, expirationAt } = event;

	if (!originalAppUserId) {
		return { processed: false, reason: 'no_user_id' };
	}

	try {
		await db
			.update(users)
			.set({
				paymentStatus: 'past_due', // Grace period
				subscriptionEndDate: expirationAt ? new Date(expirationAt) : null,
				paymentMetadata: JSON.stringify(event),
				updatedAt: new Date(),
			})
			.where(eq(users.id, originalAppUserId));

		console.log(`⚠️ Payment failed for user: ${originalAppUserId}`);

		return { processed: true, userId: originalAppUserId };
	} catch (error) {
		console.error('Error handling payment failed:', error);
		throw error;
	}
}
