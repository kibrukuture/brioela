import { AppContext } from '@/index';
import { SuperwallWebhookPayload } from '@/core/webhooks/superwall/types/superwall-events.types';
import {
	handleSubscriptionCreated,
	handleSubscriptionUpdated,
	handlePaymentSucceeded,
	handlePaymentFailed,
	handleSubscriptionCancelled,
	handleSubscriptionExpired,
	handleSubscriptionUncancelled,
} from '@/core/webhooks/superwall/services';
import { getDb } from '@/core/database/client';
import { createQStashClient, publishEmailJob } from '@/message-queue';
import type { EmailJobPayload } from '@/message-queue/types';
import { SuperwallEventEnum } from '@/core/webhooks/superwall/types/superwall-events.types';
import { API_ROUTES } from '@brioela/shared/api';
import { PRODUCTION_API_BASE_URL } from '@brioela/shared/constants';
import { apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';

export async function handleSuperwallWebhook(c: AppContext) {
	try {
		const payload: SuperwallWebhookPayload = await c.req.json();

		if (!payload || !payload.data) {
			return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Invalid webhook payload'), 400);
		}

		const { type, data } = payload;
		console.log(`📥 Received Superwall webhook: ${type}`);

		const db = getDb();

		let result;

		switch (type) {
			case SuperwallEventEnum.initial_purchase:
				result = await handleSubscriptionCreated(data, db);
				if (result.processed && result.userId) {
					await queueEmail(c, 'subscription_created', result.userId, {
						productName: data.productId,
						price: data.price,
						currency: data.currencyCode,
						nextBillingDate: data.expirationAt ? new Date(data.expirationAt).toLocaleDateString() : 'N/A',
					});
				}
				break;

			case SuperwallEventEnum.renewal:
				result = await handleSubscriptionUpdated(data, db);
				if (result.processed && result.userId) {
					await queueEmail(c, 'subscription_renewed', result.userId, {
						price: data.price,
						currency: data.currencyCode,
						nextBillingDate: data.expirationAt ? new Date(data.expirationAt).toLocaleDateString() : 'N/A',
					});
				}
				break;

			case SuperwallEventEnum.product_change:
				result = await handleSubscriptionUpdated(data, db);
				if (result.processed && result.userId) {
					await queueEmail(c, 'product_changed', result.userId, {
						newProductName: data.newProductId || data.productId,
						price: data.price,
						currency: data.currencyCode,
						nextBillingDate: data.expirationAt ? new Date(data.expirationAt).toLocaleDateString() : 'N/A',
					});
				}
				break;

			case SuperwallEventEnum.billing_issue:
				result = await handlePaymentFailed(data, db);
				if (result.processed && result.userId) {
					await queueEmail(c, 'payment_failed', result.userId, {
						updatePaymentUrl: 'https://app.brioela.com/settings/billing',
					});
				}
				break;

			case SuperwallEventEnum.cancellation:
				result = await handleSubscriptionCancelled(data, db);
				if (result.processed && result.userId) {
					await queueEmail(c, 'subscription_cancelled', result.userId, {
						expirationDate: data.expirationAt ? new Date(data.expirationAt).toLocaleDateString() : 'N/A',
					});
				}
				break;

			case SuperwallEventEnum.expiration:
				result = await handleSubscriptionExpired(data, db);
				if (result.processed && result.userId) {
					await queueEmail(c, 'subscription_expired', result.userId, {
						reactivateUrl: 'https://app.brioela.com/subscribe',
					});
				}
				break;

			case SuperwallEventEnum.uncancellation:
				result = await handleSubscriptionUncancelled(data, db);
				break;

			case SuperwallEventEnum.subscription_paused:
				result = await handleSubscriptionCancelled(data, db);
				break;

			case SuperwallEventEnum.non_renewing_purchase:
				result = await handlePaymentSucceeded(data, db);
				break;

			case SuperwallEventEnum.test:
				console.log('🧪 Test webhook received');
				return c.json({ received: true, message: 'Test webhook processed' });

			default:
				console.warn(`⚠️ Unhandled event type: ${type}`);
				return c.json({ received: true, message: 'Event type not handled' });
		}

		return c.json({
			received: true,
			processed: result.processed,
			eventType: type,
			eventId: data.id,
		});
	} catch (error) {
		console.error('Error processing Superwall webhook:', error);
		return c.json(
			{
				error: 'Webhook processing failed',
				message: error instanceof Error ? error.message : 'Unknown error',
			},
			500
		);
	}
}

async function queueEmail(c: AppContext, emailType: EmailJobPayload['emailType'], userId: string, data: Record<string, any>) {
	try {
		const qstash = createQStashClient();
		const url = PRODUCTION_API_BASE_URL + API_ROUTES.queue.email;

		const payload: EmailJobPayload = {
			type: 'email',
			emailType,
			userId,
			data,
		};

		await publishEmailJob(qstash, url, payload, {
			delay: 5, // 5 seconds delay
			retries: 3,
		});

		console.log(`📧 Email job queued: ${emailType} for user ${userId}`);
	} catch (error) {
		console.error('Failed to queue email:', error);
		// Don't throw - email failure shouldn't break webhook processing
	}
}
