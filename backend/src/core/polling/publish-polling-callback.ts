import { createQStashClient } from '@/message-queue/upstash-client';
import { publishJob } from '@/message-queue/publish';

export async function publishPollingCallback({ jobId, delaySeconds, url }: { jobId: string; delaySeconds: number; url: string }) {
	const client = createQStashClient();
	return publishJob(client, url, { type: 'polling', jobId }, { delay: delaySeconds });
}
