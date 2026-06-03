import { Next } from 'hono';
import type { AppContext } from '@/index';
import getAlignClient from '@/core/clients/align';
import { apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';
import { logWebhookEventToFile } from '@/core/webhooks/helpers/log-webhook-event';

export async function verifyAlignSignature(c: AppContext, next: Next) {
	const signature = c.req.header('x-hmac-signature');
	const rawBody = c.get('alignRawBody');

	const requestMetadata = {
		method: c.req.method,
		url: c.req.url,
		headers: Object.fromEntries(c.req.raw.headers.entries()),
		timestamp: new Date().toISOString(),
		signature: signature,
	};

	console.log('[Verify Align Signature] Raw body: ', rawBody);
	console.log('[Verify Align Signature] Signature: ', signature);
	console.log('[Verify Align Signature] Request metadata: ', requestMetadata);

	await Promise.all([
		logWebhookEventToFile(rawBody ?? '', 'align raw body: from verifyAlignSignature'),
		logWebhookEventToFile(signature ?? '', 'align signature: from verifyAlignSignature'),
		logWebhookEventToFile(JSON.stringify(requestMetadata), 'align request metadata: from verifyAlignSignature'),
	]);

	if (!signature) {
		return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing Align signature header'), 400);
	}

	const body = await c.req.text();
	if (!body) {
		return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing request body'), 400);
	}

	const align = getAlignClient();
	const isValid = align.webhooks.verifySignature(body, signature);
	if (!isValid) {
		return c.json(apiErrorResponse(ErrorCode.UNAUTHORIZED, 'Invalid webhook signature'), 401);
	}

	c.set('alignRawBody', body);
	await next();
}
