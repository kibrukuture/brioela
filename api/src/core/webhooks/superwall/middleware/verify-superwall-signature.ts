import { AppContext } from '@/index';
import { Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
export async function verifySuperwallWebhook(c: AppContext, next: Next) {
	const authToken = c.req.header('SUPERWALL_HEADER_AUTH_TOKEN');
	const expectedToken = process.env.SUPERWALL_HEADER_AUTH_TOKEN;

	if (!authToken || authToken !== expectedToken) {
		throw new HTTPException(401, {
			message: 'Invalid or missing authentication token',
		});
	}
	await next();
}
