import type { Client } from '@upstash/qstash';
import type { JobPayload, QueueJobOptions, QueueJobResult } from '@/message-queue/types';

export async function publishJob(
	client: Client,
	endpoint: string,
	payload: JobPayload,
	options?: QueueJobOptions
): Promise<QueueJobResult> {
	try {
		const response = await client.publishJSON({
			url: endpoint,
			body: payload,
			delay: options?.delay,
			retries: options?.retries ?? 3,
			headers: options?.headers,
		});

		console.log(`📤 Job published to queue: ${response.messageId}`);

		return {
			success: true,
			messageId: response.messageId,
		};
	} catch (error) {
		console.error('Failed to publish job:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export async function publishEmailJob(
	client: Client,
	url: string,
	payload: JobPayload,
	options?: QueueJobOptions
): Promise<QueueJobResult> {
	return publishJob(client, url, payload, options);
}
