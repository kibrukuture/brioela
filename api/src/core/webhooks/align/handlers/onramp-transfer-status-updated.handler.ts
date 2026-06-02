import type { WebhookEvent } from '@tolbel/align';
import { logUnhandledAlignEvent } from '@/core/webhooks/align/handlers/log-unhandled-event.handler';

export async function onOnrampTransferStatusUpdated(event: WebhookEvent) {
	await logUnhandledAlignEvent(event);
	return { received: true, transferId: event.entity_id, status: 'logged' };
}
