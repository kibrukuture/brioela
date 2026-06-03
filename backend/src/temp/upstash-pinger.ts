import { createQStashClient } from '@/message-queue/upstash-client';
import { API_ROUTES } from '@brioela/shared/api';
import { PRODUCTION_API_BASE_URL } from '@brioela/shared/constants';

export async function pingUpstash(): Promise<void> {
	try {
		const qstashClient = createQStashClient();

		const result = await qstashClient.publishJSON({
			url: PRODUCTION_API_BASE_URL + API_ROUTES.queue['temp.upstash'],
			body: { ping: 'upstash-keepalive', timestamp: new Date().toISOString() },
			headers: {
				'Content-Type': 'application/json',
			},
		});

		console.log('Upstash ping message published:', result);
	} catch (error: unknown) {
		console.error('Error pinging Upstash:', error);
	}
}
