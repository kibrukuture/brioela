import { Client } from '@upstash/qstash';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

let qstashClient: Client | null = null;

export function createQStashClient(): Client {
	if (qstashClient) {
		return qstashClient;
	}

	qstashClient = new Client({
		token: process.env.QSTASH_TOKEN,
	});

	return qstashClient;
}

export function getQStashClient(): Client {
	if (!qstashClient) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'QStash client not initialized. Call createQStashClient first.' });
	}
	return qstashClient;
}
