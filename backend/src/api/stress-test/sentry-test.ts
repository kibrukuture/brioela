import { AppContext } from '@/index';
import { backendErrorReporter } from '@/lib/sentry.config';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

export async function testSentry(c: AppContext) {
	const { action } = c.req.query();

	try {
		switch (action) {
			case 'error':
				throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Test Sentry Error!' });

			case 'fatal':
				backendErrorReporter.captureError({ name: 'Error', message: 'Fatal error test' } as Error, { tags: { test: 'fatal' } }, 'fatal');
				return c.json({ message: 'Fatal error sent to Sentry' });

			case 'warning':
				backendErrorReporter.captureError({ name: 'Error', message: 'Warning test' } as Error, { tags: { test: 'warning' } }, 'warning');
				return c.json({ message: 'Warning sent to Sentry' });

			case 'message':
				backendErrorReporter.captureMessage('Test info message', { metadata: { source: 'sentry test' } }, 'info');
				return c.json({ message: 'Info message sent to Sentry' });

			default:
				return c.json({
					message: 'Use ?action=error|fatal|warning|message',
					examples: [
						'/test-sentry?action=error',
						'/test-sentry?action=fatal',
						'/test-sentry?action=warning',
						'/test-sentry?action=message',
					],
				});
		}
	} catch (error) {
		backendErrorReporter.captureError(error as Error);
		if (error instanceof HTTPException) throw error;
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message });
	}
}
