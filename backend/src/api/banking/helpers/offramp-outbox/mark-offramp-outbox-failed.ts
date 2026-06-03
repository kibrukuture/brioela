import dayjs from 'dayjs';
import { updateOfframpOutbox } from '@/api/banking/helpers/offramp-outbox/update-offramp-outbox';

export async function markOfframpOutboxFailed(params: { outboxId: string; attempt: number; retryDelayMs: number; error?: string }) {
	const nextRunAt = dayjs().add(params.retryDelayMs, 'millisecond').toDate();
	await updateOfframpOutbox(params.outboxId, {
		status: 'failed',
		attempt: params.attempt,
		nextRunAt,
		lastError: params.error ?? null,
		lockedAt: null,
		lockedBy: null,
	});

	return { nextRunAt };
}
