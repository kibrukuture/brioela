import { getDb } from '@/core/database/client';
import { inAppNotifications } from '@brioela/shared/drizzle/schema/in-app-notification.schema';
import type { CreateInAppNotificationInput } from '@brioela/shared/validators/in-app-notification.validator';

export async function createInAppNotification(input: CreateInAppNotificationInput) {
	const db = getDb();

	const [row] = await db
		.insert(inAppNotifications)
		.values({
			userId: input.userId,
			title: input.title,
			body: input.body,
			type: input.type,
			link: input.link ?? null,
			actionLabel: input.actionLabel ?? null,
			metadata: input.metadata ?? null,
			isRead: false,
			isDeleted: false,
			createdAt: new Date(),
			readAt: null,
		})
		.returning();

	return row;
}
