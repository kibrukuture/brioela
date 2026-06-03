import dayjs from 'dayjs';
import { DEFAULT_POLLING_MAX_ATTEMPTS, DEFAULT_POLLING_TTL_MS } from '@brioela/shared/constants/polling';
import { insertPollingJob } from '@/core/polling/insert-polling-job';
import { publishPollingCallback } from '@/core/polling/publish-polling-callback';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import type { EnqueuePollingJobInput } from '@/core/polling/types';

export async function enqueuePollingJob({ input, url }: { input: EnqueuePollingJobInput; url: string }) {
	const now = dayjs();
	const ttlMs = input.ttlMs ?? DEFAULT_POLLING_TTL_MS;
	const ttlExpiry = now.add(ttlMs, 'millisecond').toDate();
	const nextRunAt = input.nextRunAt ? dayjs(input.nextRunAt) : now;

	const row = await insertPollingJob({
		provider: input.provider,
		operation: input.operation,
		internalId: input.internalId ?? null,
		externalId: input.externalId ?? null,
		context: input.context,
		payload: input.payload,
		dedupeKey: input.dedupeKey ?? null,
		maxAttempts: input.maxAttempts ?? DEFAULT_POLLING_MAX_ATTEMPTS,
		ttlExpiry,
		nextRunAt: nextRunAt.toDate(),
	});

	const delaySeconds = Math.max(0, nextRunAt.diff(now, 'second'));
	const publishResult = await publishPollingCallback({ jobId: row.id, delaySeconds, url });
	if (!publishResult.success) {
		throw new HTTPException(ErrorCode.BAD_GATEWAY, {
			message: publishResult.error ?? 'Failed to publish polling callback to QStash',
		});
	}

	return { jobId: row.id };
}
