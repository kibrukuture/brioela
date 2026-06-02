import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { createStripeClient } from '@/core/clients/stripe';
import { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { createBillingPortalSchema } from '@schnl/shared/validators/stripe.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

const RETURN_URL = 'https://healthtestlog.com/dashboard/billing';
const PORTAL_CONFIGURATION_ID = 'bpc_1SEgwDEYKMpSzno6jl0f43Mo';

export async function createBillingPortalSession(c: AppContext): Promise<{ url: string }> {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	const userId = user.id;

	const body = await c.req.json();
	const validation = createBillingPortalSchema.safeParse(body);
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: validation.error.issues[0]?.message ?? 'Invalid payload' });
	}

	const db = getDb();
	const stripe = createStripeClient();
	const [dbUser] = await db.select({ paymentCustomerId: users.paymentCustomerId }).from(users).where(eq(users.id, userId)).limit(1);
	const stripeCustomerId = dbUser?.paymentCustomerId || null;
	if (!stripeCustomerId) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Stripe customer ID not found for user' });
	}

	const session = await stripe.billingPortal.sessions.create({
		customer: stripeCustomerId,
		return_url: RETURN_URL,
		configuration: PORTAL_CONFIGURATION_ID,
	});

	if (!session.url) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'Failed to create billing portal session' });
	}

	return { url: session.url };
}
