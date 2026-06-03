import { AppContext } from '@/index';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import { getDb } from '@/core/database/client';
import { users } from '@brioela/shared/drizzle/schema/user.schema';
import { sendInAppNotification } from '@/core/notifications/in-app-notifications/send-in-app-notification';
import { parseSendInAppNotificationToAllUsersQuery } from '@/api/stress-test/helpers/parse-send-in-app-notification-to-all-users-query';

export async function sendInAppNotificationToAllUsersHandler(c: AppContext) {
	const parsed = parseSendInAppNotificationToAllUsersQuery(c.req.query());
	if (!parsed.success) {
		return c.json(apiErrorResponse(ErrorCode.VALIDATION_ERROR, 'Invalid query', parsed.error.flatten()), 400);
	}

	const { limit, title, body } = parsed.data;

	try {
		const db = getDb();
		const rows = await db.select({ id: users.id }).from(users).limit(limit);

		const results = await Promise.allSettled(
			rows.map((row) =>
				sendInAppNotification({
					userId: row.id,
					title,
					body,
					type: 'system',
				})
			)
		);

		const sent = results.filter((r) => r.status === 'fulfilled').length;
		const failed = results.length - sent;

		return c.json(
			apiSuccessResponse({
				requested: limit,
				resolvedUsers: rows.length,
				sent,
				failed,
			})
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return c.json(apiErrorResponse(ErrorCode.PROCESSING_FAILED, 'Failed to send in-app notifications', message), 500);
	}
}
