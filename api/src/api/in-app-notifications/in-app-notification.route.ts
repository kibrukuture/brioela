import { Hono } from 'hono';
import * as controller from '@/api/in-app-notifications/in-app-notification.controller';
import { API_ROUTE_PATTERNS } from '@schnl/shared/api';
import { upgradeWebSocket } from 'hono/cloudflare-workers';
import type { AppContext } from '@/index';
import type { WSContext } from 'hono/ws';
import { getInAppNotificationsConnectionStore } from '@/core/realtime/in-app-notifications/get-in-app-notifications-connection-store';
import { getInAppNotificationsWsTicketStore } from '@/core/realtime/in-app-notifications/get-in-app-notifications-ws-ticket-store';

export const inAppNotificationRouter = new Hono();

inAppNotificationRouter.get(API_ROUTE_PATTERNS.inAppNotifications.list, controller.onListInAppNotifications);

inAppNotificationRouter.patch(API_ROUTE_PATTERNS.inAppNotifications.update, controller.onUpdateInAppNotification);

inAppNotificationRouter.post(API_ROUTE_PATTERNS.inAppNotifications.markAllRead, controller.onMarkAllInAppNotificationsRead);

inAppNotificationRouter.post(API_ROUTE_PATTERNS.inAppNotifications.wsTicket, controller.onMintInAppNotificationsWsTicket);

inAppNotificationRouter.get(
	API_ROUTE_PATTERNS.inAppNotifications.ws,
	upgradeWebSocket(async (c: AppContext) => {
		const ticketFromQuery = c.req.query('ticket') ?? '';
		const store = getInAppNotificationsConnectionStore();
		let authedUserId: string | null = null;
		const ticketStore = await getInAppNotificationsWsTicketStore();
		const userId = await ticketStore.consume(ticketFromQuery);

		return {
			onMessage: async (_event: MessageEvent, ws: WSContext<WebSocket>) => {
				if (authedUserId) {
					ws.send(JSON.stringify({ type: 'in_app_notification.pong' }));
					return;
				}

				if (ticketFromQuery.length === 0) {
					ws.close();
					return;
				}

				if (!userId) {
					ws.close();
					return;
				}

				authedUserId = userId;
				store.addConnection(authedUserId, ws);
				ws.send(JSON.stringify({ type: 'in_app_notification.connected' }));
			},
			onClose: (_event: CloseEvent, ws: WSContext<WebSocket>) => {
				if (!authedUserId) return;
				store.removeConnection(authedUserId, ws);
			},
		};
	})
);
