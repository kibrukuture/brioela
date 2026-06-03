import { SuperwallEventData } from '@/core/webhooks/superwall/types/superwall-events.types';
import drizzle, { eq } from '@brioela/shared/drizzle';
import { users } from '@brioela/shared/drizzle/schema/user.schema';

export async function handleSubscriptionCancelled(event: SuperwallEventData, db: ReturnType<typeof drizzle>) {
	const { originalAppUserId, cancelReason, expirationAt } = event;

	if (!originalAppUserId) {
		return { processed: false, reason: 'no_user_id' };
	}

	try {
		await db
			.update(users)
			.set({
				paymentStatus: 'cancelled',
				subscriptionEndDate: expirationAt ? new Date(expirationAt) : null,
				cancelledAt: new Date(),
				cancelReason: cancelReason,
				paymentMetadata: JSON.stringify(event),
				updatedAt: new Date(),
			})
			.where(eq(users.id, originalAppUserId));

		console.log(`❌ Subscription cancelled for user: ${originalAppUserId}, reason: ${cancelReason}`);

		return { processed: true, userId: originalAppUserId };
	} catch (error) {
		console.error('Error handling subscription cancelled:', error);
		throw error;
	}
}

export async function handleSubscriptionExpired(event: SuperwallEventData, db: ReturnType<typeof drizzle>) {
	const { originalAppUserId, expirationReason } = event;

	if (!originalAppUserId) {
		return { processed: false, reason: 'no_user_id' };
	}

	try {
		await db
			.update(users)
			.set({
				paymentStatus: 'expired',
				subscriptionEndDate: new Date(),
				cancelReason: expirationReason || null,
				paymentMetadata: JSON.stringify(event),
				updatedAt: new Date(),
			})
			.where(eq(users.id, originalAppUserId));

		console.log(`⏰ Subscription expired for user: ${originalAppUserId}`);

		return { processed: true, userId: originalAppUserId };
	} catch (error) {
		console.error('Error handling subscription expired:', error);
		throw error;
	}
}

export async function handleSubscriptionUncancelled(event: SuperwallEventData, db: ReturnType<typeof drizzle>) {
	const { originalAppUserId, expirationAt } = event;

	if (!originalAppUserId) {
		return { processed: false, reason: 'no_user_id' };
	}

	try {
		await db
			.update(users)
			.set({
				paymentStatus: 'active',
				subscriptionEndDate: expirationAt ? new Date(expirationAt) : null,
				cancelledAt: null,
				cancelReason: null,
				paymentMetadata: JSON.stringify(event),
				updatedAt: new Date(),
			})
			.where(eq(users.id, originalAppUserId));

		console.log(`🎉 Subscription reactivated for user: ${originalAppUserId}`);

		return { processed: true, userId: originalAppUserId };
	} catch (error) {
		console.error('Error handling subscription uncancelled:', error);
		throw error;
	}
}
