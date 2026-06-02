import { updateOfframpOutbox } from '@/api/banking/helpers/offramp-outbox/update-offramp-outbox';

export async function markOfframpOutboxDone(params: { outboxId: string }) {
	await updateOfframpOutbox(params.outboxId, {
		status: 'done',
		lastError: null,
		lockedAt: null,
		lockedBy: null,
	});
}
