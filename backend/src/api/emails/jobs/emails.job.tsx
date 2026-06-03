import type { EmailJobPayload } from '@/message-queue/types';
import { getDb } from '@/core/database/client';
import { users } from '@schnl/shared/drizzle/schema';
import { eq } from '@schnl/shared/drizzle';
import { AppContext } from '@/index';
import { sendEmail } from '@/core/email/send';
import PaymentFailedTemplate from '@/core/email/templates/payment-failed.template';
import SubscriptionCreatedTemplate from '@/core/email/templates/subscription-created.template';
import SubscriptionRenewedTemplate from '@/core/email/templates/subscription-renewed.template';
import SubscriptionCancelledTemplate from '@/core/email/templates/subscription-cancelled.template';
import SubscriptionExpiredTemplate from '@/core/email/templates/subscription-expired.template';
import ProductChangedTemplate from '@/core/email/templates/product-changed.template';
import { renderToString } from 'hono/jsx/dom/server';

import { EMAIL_FROM } from '@schnl/shared/constants';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';

export async function emailsJobOrchestrator(c: AppContext) {
	try {
		const payload: EmailJobPayload = await c.req.json();

		if (!payload || payload.type !== 'email') {
			return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Invalid email job payload'), 400);
		}

		const { emailType, userId, data } = payload;

		// Get user from database
		const db = getDb();
		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

		if (!user || !user.email) {
			console.error(`User not found or no email: ${userId}`);
			return c.json(apiErrorResponse(ErrorCode.NOT_FOUND, 'User not found'), 404);
		}

		// Get email template
		let template: string = '';

		switch (emailType) {
			case 'subscription_created':
				template = renderToString(<SubscriptionCreatedTemplate />);
				break;
			case 'subscription_renewed':
				template = renderToString(<SubscriptionRenewedTemplate />);
				break;
			case 'subscription_cancelled':
				template = renderToString(<SubscriptionCancelledTemplate />);
				break;
			case 'payment_failed':
				template = renderToString(<PaymentFailedTemplate />);
				break;
			case 'subscription_expired':
				template = renderToString(<SubscriptionExpiredTemplate />);
				break;
			case 'product_changed':
				template = renderToString(<ProductChangedTemplate />);
				break;
			default:
				return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Unknown email type'), 400);
		}

		// Send email using one-off method (better for queue jobs)

		await sendEmail({
			to: user.email,
			subject: emailType.split('_').join(' '),
			html: template,
			from: EMAIL_FROM.generic,
		});

		return c.json(
			apiSuccessResponse({
				success: true,
				emailType,
				userId,
			})
		);
	} catch (error) {
		console.error('Error handling email job:', error);
		return c.json(
			apiErrorResponse(
				ErrorCode.PROCESSING_FAILED,
				'Email job processing failed',
				error instanceof Error ? error.message : 'Unknown error'
			),
			500
		);
	}
}
