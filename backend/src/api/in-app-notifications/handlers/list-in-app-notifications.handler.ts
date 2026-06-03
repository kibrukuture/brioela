import { HTTPException } from 'hono/http-exception';
import type { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { and, desc, eq } from '@brioela/shared/drizzle';
import { inAppNotifications } from '@brioela/shared/drizzle/schema/in-app-notification.schema';
import { listInAppNotificationsResponseSchema } from '@brioela/shared/validators/in-app-notification.validator';

export async function listInAppNotificationsHandler(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(401, { message: 'Unauthorized' });

	const db = getDb();
	const rows = await db
		.select()
		.from(inAppNotifications)
		.where(and(eq(inAppNotifications.userId, user.id), eq(inAppNotifications.isDeleted, false)))
		.orderBy(desc(inAppNotifications.createdAt));

	const validation = listInAppNotificationsResponseSchema.safeParse({
		notifications: rows,
	});
	if (!validation.success) {
		throw new HTTPException(500, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
