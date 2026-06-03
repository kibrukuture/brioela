import { SuperwallEventData } from '@/core/webhooks/superwall/types/superwall-events.types';
import drizzle, { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';

export async function handleSubscriptionUpdated(event: SuperwallEventData, db: ReturnType<typeof drizzle>) {
	const { originalAppUserId, originalTransactionId, productId, price, currencyCode, expirationAt, periodType, purchasedAt, newProductId } =
		event;

	if (!originalAppUserId) {
		console.error('No originalAppUserId in renewal event');
		return { processed: false, reason: 'no_user_id' };
	}

	try {
		const updateData: Partial<typeof users.$inferSelect> = {
			paymentStatus: 'active',
			subscriptionEndDate: expirationAt ? new Date(expirationAt) : null,
			lastPaid: new Date(purchasedAt),
			subscriptionPeriodType: periodType,
			isInTrial: periodType === 'TRIAL',
			paymentMetadata: JSON.stringify(event),
			updatedAt: new Date(),
		};

		// If product changed
		if (newProductId) {
			updateData.subscriptionProductId = newProductId;
			updateData.subscriptionProductPrice = Math.round(price * 100);
			updateData.subscriptionProductCurrency = currencyCode;
		}

		await db.update(users).set(updateData).where(eq(users.id, originalAppUserId));

		console.log(`✅ Subscription renewed for user: ${originalAppUserId}`);

		return { processed: true, userId: originalAppUserId };
	} catch (error) {
		console.error('Error handling subscription renewal:', error);
		throw error;
	}
}
