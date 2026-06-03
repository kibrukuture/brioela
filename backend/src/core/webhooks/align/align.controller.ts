import type { AppContext } from '@/index';
import type { WebhookEvent, WebhookEventType } from '@tolbel/align';
import { onCustomerKycsUpdated } from '@/core/webhooks/align/handlers/customer-kycs-updated.handler';
import { onOfframpTransferStatusUpdated } from '@/core/webhooks/align/handlers/offramp-transfer-status-updated.handler';
import { onOnrampTransferStatusUpdated } from '@/core/webhooks/align/handlers/onramp-transfer-status-updated.handler';
import { logUnhandledAlignEvent } from '@/core/webhooks/align/handlers/log-unhandled-event.handler';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import { logWebhookEventToFile } from '@/core/webhooks/helpers/log-webhook-event';

export async function onAlignWebhook(c: AppContext) {
	const rawBody = c.get('alignRawBody');

	console.log('[Align Webhook] Raw body: ', rawBody);

	await logWebhookEventToFile(rawBody ?? '', 'align raw body: from OnAlignWebhook');

	if (!rawBody) {
		return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing raw body'), 400);
	}

	let event: WebhookEvent;
	try {
		event = JSON.parse(rawBody);
	} catch (error) {
		await logWebhookEventToFile(rawBody, 'align FAILED JSON parse');
		return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Invalid JSON payload'), 400);
	}

	if (!event?.event_type || !event?.entity_id) {
		await logWebhookEventToFile(JSON.stringify(event), 'align INVALID event shape');
		return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Invalid webhook event shape'), 400);
	}

	await logWebhookEventToFile(JSON.stringify(event), `align event: ${event.event_type}`);

	switch (event.event_type as WebhookEventType) {
		case 'customer.kycs.updated': {
			const result = await onCustomerKycsUpdated(event);

			if (!result.processed) {
				return c.json(apiErrorResponse(ErrorCode.NOT_FOUND, result.message ?? 'User not found for customer_id'), 200);
			}

			return c.json(
				apiSuccessResponse({
					received: true,
					processed: true,
					eventType: event.event_type,
					customerId: event.entity_id,
					bankingKycStatus: result.bankingKycStatus,
				})
			);
		}
		case 'virtual_account.created':
			// TODO: handle virtual account created
			return;

		case 'cross_chain_transfer.status.updated':
			// TODO: handle cross chain transfer status updated
			return;
		case 'offramp_transfer.status.updated':
			await onOfframpTransferStatusUpdated(event);
			return c.json(apiSuccessResponse({ received: true, processed: true, eventType: event.event_type }));

		case 'onramp_transfer.status.updated':
			await onOnrampTransferStatusUpdated(event);
			return c.json(apiSuccessResponse({ received: true, processed: true, eventType: event.event_type }));

		default:
			await logUnhandledAlignEvent(event);
			return c.json(apiSuccessResponse({ received: true, ignored: true, eventType: event.event_type }));
	}
}
