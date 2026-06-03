import drizzle, { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema';

export async function getUserStripeCustomerId(db: ReturnType<typeof drizzle>, userId: string): Promise<string | null> {
	const [user] = await db.select({ paymentCustomerId: users.paymentCustomerId }).from(users).where(eq(users.id, userId)).limit(1);

	return user?.paymentCustomerId || null;
}

export async function setUserStripeCustomerId(
	db: ReturnType<typeof drizzle>,
	params: { userId: string; stripeCustomerId: string }
): Promise<void> {
	await db.update(users).set({ paymentCustomerId: params.stripeCustomerId }).where(eq(users.id, params.userId));
}
