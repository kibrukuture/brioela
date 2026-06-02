import { HTTPException } from 'hono/http-exception';
import type { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { and, eq } from '@schnl/shared/drizzle';
import { inAppNotifications } from '@schnl/shared/drizzle/schema/in-app-notification.schema';
import { markAllInAppNotificationsReadResponseSchema } from '@schnl/shared/validators/in-app-notification.validator';
import { broadcastInAppNotificationEvent } from '@/core/realtime/in-app-notifications/broadcast-in-app-notification-event';

export async function markAllInAppNotificationsReadHandler(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(401, { message: 'Unauthorized' });

	const db = getDb();

	const rows = await db
		.update(inAppNotifications)
		.set({ isRead: true, readAt: new Date() })
		.where(and(eq(inAppNotifications.userId, user.id), eq(inAppNotifications.isDeleted, false), eq(inAppNotifications.isRead, false)))
		.returning({ id: inAppNotifications.id });

	const validation = markAllInAppNotificationsReadResponseSchema.safeParse({
		updated: rows.length,
	});
	if (!validation.success) {
		throw new HTTPException(500, { message: validation.error.issues[0].message });
	}

	broadcastInAppNotificationEvent(user.id, {
		type: 'in_app_notification.updated',
		payload: validation.data,
	});

	return validation.data;
}
