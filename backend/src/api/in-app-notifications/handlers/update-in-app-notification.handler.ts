import { HTTPException } from 'hono/http-exception';
import type { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { and, eq } from '@brioela/shared/drizzle';
import { inAppNotifications } from '@brioela/shared/drizzle/schema/in-app-notification.schema';
import {
	inAppNotificationIdParamSchema,
	updateInAppNotificationSchema,
	updateInAppNotificationResponseSchema,
} from '@brioela/shared/validators/in-app-notification.validator';
import { broadcastInAppNotificationEvent } from '@/core/realtime/in-app-notifications/broadcast-in-app-notification-event';

export async function updateInAppNotificationHandler(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(401, { message: 'Unauthorized' });

	const idParams = inAppNotificationIdParamSchema.safeParse({ id: c.req.param('id') });
	if (!idParams.success) {
		throw new HTTPException(400, { message: idParams.error.issues[0].message });
	}

	const body = await c.req.json();
	const parsed = updateInAppNotificationSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(400, { message: parsed.error.issues[0].message });
	}

	const db = getDb();

	const nextReadAt = parsed.data.isRead === true ? new Date() : undefined;

	const [row] = await db
		.update(inAppNotifications)
		.set({
			...(parsed.data.isRead !== undefined ? { isRead: parsed.data.isRead } : {}),
			...(parsed.data.isDeleted !== undefined ? { isDeleted: parsed.data.isDeleted } : {}),
			...(nextReadAt ? { readAt: nextReadAt } : {}),
		})
		.where(and(eq(inAppNotifications.id, idParams.data.id), eq(inAppNotifications.userId, user.id)))
		.returning();

	if (!row) {
		throw new HTTPException(404, { message: 'Notification not found' });
	}

	const output = updateInAppNotificationResponseSchema.safeParse({ notification: row });
	if (!output.success) {
		throw new HTTPException(500, { message: output.error.issues[0].message });
	}

	broadcastInAppNotificationEvent(user.id, {
		type: 'in_app_notification.updated',
		payload: output.data,
	});

	return output.data;
}
