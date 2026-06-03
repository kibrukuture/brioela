import { getDb } from '@/core/database/client';
import { bankingKycEvents } from '@brioela/shared/drizzle/schema';
import type { WebhookEvent } from '@tolbel/align';
import { BANKING_PROVIDERS } from '@brioela/shared/constants/banking-providers';

export async function logUnhandledAlignEvent(event: WebhookEvent) {
	const db = getDb();

	await db.insert(bankingKycEvents).values({
		userId: null,
		provider: BANKING_PROVIDERS.ALIGN,
		providerCustomerId: event.entity_id,
		eventType: event.event_type,
		payload: event as unknown as Record<string, unknown>,
	});
}
