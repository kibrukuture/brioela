import { DEFAULT_OFFRAMP_OUTBOX_BACKOFF_MS } from '@schnl/shared/constants/offramp-outbox';

export function getOfframpOutboxRetryDelayMs(attempt: number): number {
	const index = Math.min(Math.max(0, attempt), DEFAULT_OFFRAMP_OUTBOX_BACKOFF_MS.length - 1);
	return DEFAULT_OFFRAMP_OUTBOX_BACKOFF_MS[index];
}
