import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { createStripeClient } from '@/core/clients/stripe';
import { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { createTopupIntentSchema } from '@schnl/shared/validators/stripe.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

type CreateTopupIntentResponse = {
	paymentIntentClientSecret: string;
	customerId: string;
	ephemeralKeySecret: string;
	defaultBillingDetails?: {
		name?: string;
		email?: string;
		phone?: string;
		address?: {
			city?: string;
			country?: string;
			line1?: string;
			line2?: string;
			postalCode?: string;
			state?: string;
		};
	};
};

export async function createTopupIntent(c: AppContext): Promise<CreateTopupIntentResponse> {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	const userId = user.id;

	const body = await c.req.json();
	const validation = createTopupIntentSchema.safeParse(body);
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: validation.error.issues[0]?.message ?? 'Invalid payload' });
	}

	const { amount, currency } = validation.data;
	const db = getDb();
	const stripe = createStripeClient();
	const [dbUser] = await db
		.select({
			paymentCustomerId: users.paymentCustomerId,
			firstName: users.firstName,
			lastName: users.lastName,
			email: users.email,
			phone: users.phone,
		})
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	let stripeCustomerId = dbUser?.paymentCustomerId || null;
	if (!stripeCustomerId) {
		const customerName = [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(' ') || undefined;
		const customer = await stripe.customers.create({
			name: customerName,
			email: dbUser?.email,
			phone: dbUser?.phone || undefined,
			metadata: {
				userId,
			},
		});
		stripeCustomerId = customer.id;
		await db.update(users).set({ paymentCustomerId: stripeCustomerId }).where(eq(users.id, userId));
	}

	const ephemeralKey = await stripe.ephemeralKeys.create({ customer: stripeCustomerId }, { apiVersion: '2025-11-17.clover' });
	if (!ephemeralKey.secret) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'Failed to create ephemeral key' });
	}

	const paymentIntent = await stripe.paymentIntents.create({
		amount,
		currency,
		customer: stripeCustomerId,
		automatic_payment_methods: { enabled: true },
		metadata: {
			userId,
			email: dbUser?.email || '',
			type: 'topup',
		},
	});

	if (!paymentIntent.client_secret) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'Failed to create payment intent' });
	}

	const fullName = [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(' ') || undefined;
	const defaultBillingDetails: {
		name?: string;
		email?: string;
		phone?: string;
	} = {};

	if (fullName) defaultBillingDetails.name = fullName;
	if (dbUser?.email) defaultBillingDetails.email = dbUser.email;
	if (dbUser?.phone) defaultBillingDetails.phone = dbUser.phone;

	return {
		paymentIntentClientSecret: paymentIntent.client_secret,
		customerId: stripeCustomerId,
		ephemeralKeySecret: ephemeralKey.secret,
		...(Object.keys(defaultBillingDetails).length > 0 && { defaultBillingDetails }),
	};
}
