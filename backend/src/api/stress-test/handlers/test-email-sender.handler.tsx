import { AppContext } from '@/index';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';
import getResendClient from '@/core/clients/resend';
import StressTestEmailTemplate from '@/core/email/templates/stress-test-email.template';
import { renderToString } from 'hono/jsx/dom/server';
import { EMAIL_FROM } from '@schnl/shared/constants';
import { getUserCommunicationCode } from '@/core/email/helpers/get-user-communication-code';
import { getDb } from '@/core/database/client';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { eq } from '@schnl/shared/drizzle';

export async function testEmailSenderHandler(c: AppContext) {
	const to = c.req.query('email');
	if (!to) {
		return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Missing email query param'), 400);
	}

	try {
		// Resolve user by email (no auth required for stress-test)
		const db = getDb();
		const [userRow] = await db.select().from(users).where(eq(users.email, to)).limit(1);
		const communicationCode = userRow ? await getUserCommunicationCode(userRow.id) : null;
		const html = renderToString(
			<StressTestEmailTemplate message="Hello from stress-test endpoint." communicationCode={communicationCode} />
		);
		const result = await getResendClient().emails.send({
			to,
			from: EMAIL_FROM.generic,
			subject: 'Schnl stress-test: domain check',
			html,
		});

		return c.json(
			apiSuccessResponse({
				success: true,
				message: 'Email sent successfully',
				id: result.data?.id,
			})
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return c.json(apiErrorResponse(ErrorCode.PROCESSING_FAILED, 'Error sending email', message), 500);
	}
}
