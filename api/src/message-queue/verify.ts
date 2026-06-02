import { Receiver } from '@upstash/qstash';
import { AppContext } from '@/index';
import { HTTPException } from 'hono/http-exception';
import { Next } from 'hono';

export async function verifyQStashSignature(c: AppContext, next: Next): Promise<void> {
	const signature = c.req.header('upstash-signature');

	if (!signature) {
		throw new HTTPException(401, {
			message: 'Missing QStash signature',
		});
	}

	const receiver = new Receiver({
		currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
		nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
	});

	const body = await c.req.text();
	const url = new URL(c.req.url).toString();

	try {
		const shouldPass = await receiver.verify({
			signature,
			body,
			url,
		});
		console.log('[Qstash Verified: ', shouldPass);

		await next();
	} catch (error) {
		console.error('QStash signature verification failed:', error);
		throw new HTTPException(401, {
			message: 'Invalid QStash signature',
		});
	}
}
