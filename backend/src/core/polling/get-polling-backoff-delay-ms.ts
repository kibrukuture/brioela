import { DEFAULT_POLLING_BACKOFF_MS } from '@schnl/shared/constants/polling';

export function getPollingBackoffDelayMs(attempt: number): number {
	const index = Math.min(attempt, DEFAULT_POLLING_BACKOFF_MS.length - 1);
	return DEFAULT_POLLING_BACKOFF_MS[index];
}
