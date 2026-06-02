import { uploadJson } from '@/core/storage/services/s3.service';

export async function logWebhookEventToFile(
	eventType: string,
	eventData: unknown,
	source: 'stripe' | 'align' | 'superwall' = 'stripe'
): Promise<void> {
	try {
		const env = process.env.ENVIRONMENT || 'development';
		if (env !== 'development') {
			return;
		}

		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const key = `webhook-logs/${source}/${timestamp}_${eventType}.json`;

		const logContent = {
			timestamp: new Date().toISOString(),
			eventType,
			source,
			data: eventData,
		};

		await uploadJson({ key, data: logContent });

		console.log(`[Webhook Logger] Event logged to S3: ${key}`);
	} catch (error) {
		console.error('[Webhook Logger] Failed to log event to S3:', error);
	}
}
