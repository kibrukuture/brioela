import { Hono } from 'hono';
import { AppContext } from '@/index';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';
import { extractText } from '@/core/ai/functions/extract-text';
import { testDatabase } from '@/api/stress-test/test-database';
import Align from '@tolbel/align';
import { createCustomerHandler, getCustomerHandler, getKycLinkHandler } from '@/api/stress-test/bank-test';
import { registerSessionTest } from '@/api/stress-test/banking-session-test';
import Courier from '@trycourier/courier';
import { pushAdminSendSchema } from '@brioela/shared/validators/notifications.validator';
import { sendOneSignalPush } from '@/core/clients/onesignal';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import { z } from '@brioela/shared/zod';
import getAlignClient from '@/core/clients/align';
import { uploadJson } from '@/core/storage/services/s3.service';
import { testEmailSenderHandler } from '@/api/stress-test/handlers/test-email-sender.handler';
import simulateCustomer from '@/api/stress-test/handlers/simulate-customer.handler';
import { sendInAppNotificationToAllUsersHandler } from '@/api/stress-test/handlers/send-in-app-notification-to-all-users.handler';
import onAlignWebhooks from './setup';

const stressTestRoutes = new Hono();

stressTestRoutes.post(API_ROUTE_PATTERNS.stressTest.extractText, async (c: AppContext) => {
	// const { text } = await c.req.json();
	const documentUrl = 'https://pdfobject.com/pdf/sample.pdf';
	const result = await extractText(c, documentUrl);
	return c.json(result);
});

// Test email endpoint
stressTestRoutes.get(API_ROUTE_PATTERNS.stressTest.sendTestEmail, testEmailSenderHandler);

// Test crypto wallet endpoint using @tolbel/align SDK
stressTestRoutes.get('/test-crypto', async (c: AppContext) => {
	try {
		// Initialize Align SDK
		const align = new Align({
			apiKey: process.env.ALIGNLAB_API_KEY!,
			environment: 'production',
		});

		const result = await align.blockchain.wallets.create();

		return c.json(result);
	} catch (error) {
		return c.json(
			apiErrorResponse(
				ErrorCode.PROCESSING_FAILED,
				'Error testing crypto/blockchain',
				error instanceof Error ? error.message : 'Unknown error'
			),
			500
		);
	}
});

const alignCustomerLookupSchema = z.object({
	email: z.string().email(),
});

stressTestRoutes.post('/align/customers/list', async (c: AppContext) => {
	const body = await c.req.json();
	const parsed = alignCustomerLookupSchema.safeParse(body);
	if (!parsed.success) {
		return c.json(apiErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid payload', parsed.error.flatten()), 400);
	}

	const client = getAlignClient();
	const customers = await client.customers.list(parsed.data.email);
	return c.json(apiSuccessResponse(customers));
});

stressTestRoutes.post(API_ROUTE_PATTERNS.stressTest.createCustomer, createCustomerHandler);
stressTestRoutes.get(API_ROUTE_PATTERNS.stressTest.getCustomer, getCustomerHandler);
stressTestRoutes.get(API_ROUTE_PATTERNS.stressTest.getKycLink, getKycLinkHandler);
stressTestRoutes.get('/banking/session-register', registerSessionTest);

stressTestRoutes.post('/align/webhook/setup', async (c: AppContext) => {
	try {
		const res = await onAlignWebhooks(c);
		return c.json(apiSuccessResponse(res));
	} catch (error) {
		return c.json(
			apiErrorResponse(
				ErrorCode.PROCESSING_FAILED,
				'Failed to setup align webhook',
				error instanceof Error ? error.message : 'Unknown error'
			),
			500
		);
	}
});

// Test database endpoint
stressTestRoutes.get('/test-database', testDatabase);

// In-app notifications stress-test (no auth): sends an in-app notification to a batch of users
stressTestRoutes.get('/in-app-notifications/broadcast', sendInAppNotificationToAllUsersHandler);

stressTestRoutes.post(API_ROUTE_PATTERNS.stressTest.sendPush, async (c: AppContext) => {
	try {
		const body = await c.req.json();
		const parsed = pushAdminSendSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(apiErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid payload', parsed.error.flatten()), 400);
		}
		const authKey = process.env.COURIER_AUTH_KEY;
		if (!authKey) {
			return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'COURIER_AUTH_KEY is not configured'), 500);
		}
		const client = new Courier({ apiKey: authKey });
		console.log('stress-test.sendPush start', {
			user_id: 'user_id' in parsed.data ? parsed.data.user_id : undefined,
			kind: 'template_id' in parsed.data ? 'template' : 'content',
		});
		if ('template_id' in parsed.data) {
			const res = await client.send.message({
				message: {
					to: { user_id: parsed.data.user_id },
					template: parsed.data.template_id,
					data: parsed.data.data ?? {},
					routing: { method: 'single', channels: ['push'] },
				},
			});
			console.log('stress-test.sendPush success', { requestId: res.requestId });
			return c.json(apiSuccessResponse({ status: 'queued', requestId: res.requestId }));
		} else {
			const res = await client.send.message({
				message: {
					to: { user_id: parsed.data.user_id },
					content: { title: parsed.data.title, body: parsed.data.body },
					data: parsed.data.data ?? {},
					routing: { method: 'single', channels: ['push'] },
				},
			});
			console.log('stress-test.sendPush success', { requestId: res.requestId });
			return c.json(apiSuccessResponse({ status: 'queued', requestId: res.requestId }));
		}
	} catch (error) {
		const details = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
		console.error('stress-test.sendPush error', details);
		return c.json(apiErrorResponse(ErrorCode.PROCESSING_FAILED, 'Failed to send push', details), 500);
	}
});

stressTestRoutes.post(API_ROUTE_PATTERNS.stressTest.sendOneSignal, async (c: AppContext) => {
	try {
		const userId = c.req.query('userId');
		if (!userId) {
			return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing userId query'), 400);
		}
		const body = await c.req.json();
		const title = body?.title as string;
		const message = body?.body as string;
		if (!title || !message) {
			return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing title or body'), 400);
		}
		const data = body?.data as Record<string, string> | undefined;
		const res = await sendOneSignalPush({ userId, title, body: message, data });
		return c.json(apiSuccessResponse({ status: 'queued', id: res.id }));
	} catch (error) {
		const details = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
		return c.json(apiErrorResponse(ErrorCode.PROCESSING_FAILED, 'Failed to send onesignal push', details), 500);
	}
});

stressTestRoutes.get('/test-s3-upload', async (c: AppContext) => {
	try {
		const testData = {
			message: 'S3 upload test',
			timestamp: new Date().toISOString(),
			environment: process.env.ENVIRONMENT,
			testId: Math.random().toString(36).substring(7),
		};

		const key = `test-uploads/${new Date().toISOString().replace(/[:.]/g, '-')}_test.json`;
		await uploadJson({ key, data: testData });

		return c.json(
			apiSuccessResponse({
				message: 'S3 upload successful',
				key,
				data: testData,
			})
		);
	} catch (error) {
		const details = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
		return c.json(apiErrorResponse(ErrorCode.PROCESSING_FAILED, 'Failed to upload to S3', details), 500);
	}
});

stressTestRoutes.get('/simulate-customer', simulateCustomer);

export default stressTestRoutes;
