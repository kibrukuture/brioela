import { AppContext } from '@/index';
import { apiSuccessResponse } from '@/lib/response';
import * as handlers from '@/api/in-app-notifications/handlers';

export async function onListInAppNotifications(c: AppContext) {
	const response = await handlers.listInAppNotificationsHandler(c);
	return c.json(apiSuccessResponse(response));
}

export async function onUpdateInAppNotification(c: AppContext) {
	const response = await handlers.updateInAppNotificationHandler(c);
	return c.json(apiSuccessResponse(response));
}

export async function onMarkAllInAppNotificationsRead(c: AppContext) {
	const response = await handlers.markAllInAppNotificationsReadHandler(c);
	return c.json(apiSuccessResponse(response));
}

export async function onMintInAppNotificationsWsTicket(c: AppContext) {
	const response = await handlers.mintInAppNotificationsWsTicketHandler(c);
	return c.json(apiSuccessResponse(response));
}
