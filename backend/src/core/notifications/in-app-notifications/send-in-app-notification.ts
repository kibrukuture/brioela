import { createInAppNotificationSchema } from '@schnl/shared/validators/in-app-notification.validator';
import { createInAppNotification } from '@/core/notifications/in-app-notifications/create-in-app-notification';
import { broadcastInAppNotificationEvent } from '@/core/realtime/in-app-notifications/broadcast-in-app-notification-event';

export async function sendInAppNotification(input: unknown) {
	const parsed = createInAppNotificationSchema.safeParse(input);
	if (!parsed.success) {
		throw new Error(parsed.error.issues[0].message);
	}

	const row = await createInAppNotification(parsed.data);

	broadcastInAppNotificationEvent(parsed.data.userId, {
		type: 'in_app_notification.created',
		payload: { notification: row },
	});

	return row;
}
