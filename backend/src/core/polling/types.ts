import type { PollingJob } from '@schnl/shared/drizzle/schema/polling-jobs.schema';

export type PollingOperationResult = {
	done: boolean;
	retryDelayMs?: number;
	error?: string;
};

export type PollingOperation = (job: PollingJob) => Promise<PollingOperationResult>;

export type ResolvePollingOperation = (job: PollingJob) => PollingOperation | undefined;

export type EnqueuePollingJobInput = {
	provider: string;
	operation: string;
	internalId?: string | null;
	externalId?: string | null;
	context?: unknown;
	payload?: unknown;
	dedupeKey?: string | null;
	maxAttempts?: number;
	ttlMs?: number;
	nextRunAt?: Date;
};
