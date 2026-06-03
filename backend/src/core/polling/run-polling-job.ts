import dayjs from 'dayjs';
import { getPollingJobById } from '@/core/polling/get-polling-job-by-id';
import { getPollingBackoffDelayMs } from '@/core/polling/get-polling-backoff-delay-ms';
import { markPollingJob } from '@/core/polling/mark-polling-job';
import { publishPollingCallback } from '@/core/polling/publish-polling-callback';
import { updatePollingJob } from '@/core/polling/update-polling-job';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import type { ResolvePollingOperation } from '@/core/polling/types';

export async function runPollingJob({
	jobId,
	resolvePollingOperation,
	url,
}: {
	jobId: string;
	resolvePollingOperation: ResolvePollingOperation;
	url: string;
}) {
	const job = await getPollingJobById(jobId);
	if (!job) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: `Polling job ${jobId} not found` });
	}

	const now = dayjs();
	if (dayjs(job.ttlExpiry).isBefore(now)) {
		await markPollingJob(job.id, 'expired', { lastError: 'TTL expired' });
		return { jobId: job.id, status: 'expired' };
	}

	if (job.status === 'done' || job.status === 'expired') {
		return { jobId: job.id, status: job.status };
	}

	if (dayjs(job.nextRunAt).isAfter(now)) {
		return { jobId: job.id, status: 'scheduled' };
	}

	const run = resolvePollingOperation(job);
	if (!run) {
		await markPollingJob(job.id, 'failed', { lastError: 'No polling operation registered' });
		throw new HTTPException(ErrorCode.NOT_IMPLEMENTED, {
			message: `Polling operation not registered: ${job.provider}:${job.operation}`,
		});
	}

	const nextAttempt = job.attempt + 1;
	if (nextAttempt > job.maxAttempts) {
		await markPollingJob(job.id, 'failed', { lastError: 'Max attempts reached' });
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Max polling attempts reached' });
	}

	await updatePollingJob(job.id, { status: 'in_progress', attempt: nextAttempt });

	try {
		const result = await run(job);
		if (result.done) {
			await markPollingJob(job.id, 'done');
			return { jobId: job.id, status: 'done' };
		}

		const retryDelayMs = result.retryDelayMs ?? getPollingBackoffDelayMs(Math.max(0, nextAttempt - 1));
		const nextRunAt = now.add(retryDelayMs, 'millisecond');

		await updatePollingJob(job.id, {
			status: 'failed',
			nextRunAt: nextRunAt.toDate(),
			lastError: result.error,
		});

		const delaySeconds = Math.max(0, nextRunAt.diff(now, 'second'));
		const publishResult = await publishPollingCallback({ jobId: job.id, delaySeconds, url });
		if (!publishResult.success) {
			throw new HTTPException(ErrorCode.BAD_GATEWAY, {
				message: publishResult.error ?? 'Failed to publish polling callback to QStash',
			});
		}

		return { jobId: job.id, status: 'retry_scheduled', nextRunAt: nextRunAt.toDate() };
	} catch (error: unknown) {
		if (error instanceof HTTPException) {
			await updatePollingJob(job.id, {
				status: 'failed',
				lastError: error.message,
			});
			throw error;
		}

		const retryDelayMs = getPollingBackoffDelayMs(Math.max(0, nextAttempt - 1));
		const nextRunAt = now.add(retryDelayMs, 'millisecond');

		await updatePollingJob(job.id, {
			status: 'failed',
			nextRunAt: nextRunAt.toDate(),
			lastError: error instanceof Error ? error.message : 'Unknown error',
		});

		const delaySeconds = Math.max(0, nextRunAt.diff(now, 'second'));
		const publishResult = await publishPollingCallback({ jobId: job.id, delaySeconds, url });
		if (!publishResult.success) {
			throw new HTTPException(ErrorCode.BAD_GATEWAY, {
				message: publishResult.error ?? 'Failed to publish polling callback to QStash',
			});
		}

		return { jobId: job.id, status: 'retry_scheduled', nextRunAt: nextRunAt.toDate() };
	}
}
