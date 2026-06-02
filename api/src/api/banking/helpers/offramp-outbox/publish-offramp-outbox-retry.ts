import { publishOfframpOutboxQueueJob } from '@/api/banking/helpers/offramp-outbox/publish-offramp-outbox-queue-job';

type PublishOfframpOutboxRetryResult = { published: true; delaySeconds: number } | { published: false };

export async function publishOfframpOutboxRetry(params: {
	outboxId: string;
	retryDelayMs: number;
}): Promise<PublishOfframpOutboxRetryResult> {
	const delaySeconds = Math.ceil(params.retryDelayMs / 1000);
	if (delaySeconds <= 0) return { published: false };

	await publishOfframpOutboxQueueJob({ outboxId: params.outboxId, delaySeconds });
	return { published: true, delaySeconds };
}
