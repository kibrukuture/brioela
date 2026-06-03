import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { createStripeClient } from '@/core/clients/stripe';

export async function verifyStripeSignature(c: Context, next: Next) {
	try {
		const signature = c.req.header('stripe-signature');
		const webhookSecret = process.env.STRIPE_SECRET_WEBHOOK_KEY;

		if (!signature) {
			throw new HTTPException(400, {
				message: 'Missing Stripe signature header',
			});
		}

		if (!webhookSecret) {
			throw new HTTPException(500, {
				// 500 because this is a server config issue
				message: 'Webhook secret not configured',
			});
		}

		const body = await c.req.text();
		if (!body) {
			throw new HTTPException(400, {
				message: 'Missing request body',
			});
		}

		const stripe = createStripeClient();
		const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

		c.set('stripeEvent', event);
		await next();
	} catch (error) {
		console.error('Stripe webhook verification failed:', error);

		// If it's already an HTTPException, rethrow it
		if (error instanceof HTTPException) {
			throw error;
		}

		// For constructEvent failures, return 400
		throw new HTTPException(400, {
			message: 'Webhook signature verification failed',
		});
	}
}
