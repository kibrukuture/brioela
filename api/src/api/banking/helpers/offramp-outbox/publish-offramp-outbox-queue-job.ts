import { createQStashClient } from '@/message-queue';
import { publishJob } from '@/message-queue/publish';
import { PRODUCTION_API_BASE_URL } from '@schnl/shared/constants';
import { QUEUE_ROUTES } from '@schnl/shared/api/queue.routes';

export async function publishOfframpOutboxQueueJob(params: { outboxId: string; delaySeconds?: number }) {
	const qstash = createQStashClient();
	return publishJob(
		qstash,
		PRODUCTION_API_BASE_URL + QUEUE_ROUTES['banking.offramp-outbox-process'],
		{ type: 'banking.offramp_outbox_process', outboxId: params.outboxId },
		{ delay: params.delaySeconds }
	);
}
