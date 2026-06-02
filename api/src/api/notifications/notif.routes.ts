import { Hono } from 'hono';
import * as notifController from '@/api/notifications/notif.controller';
import * as courierController from '@/api/notifications/courier.controller';
import { API_ROUTE_PATTERNS } from '@schnl/shared/api';

const notificationsRoutes = new Hono();

notificationsRoutes.post(API_ROUTE_PATTERNS.notifications['courier.mint-jwt'], courierController.onMintJwt);
notificationsRoutes.post(API_ROUTE_PATTERNS.notifications['push.register'], notifController.onRegister);
notificationsRoutes.post(API_ROUTE_PATTERNS.notifications['push.unregister'], notifController.onUnregister);

export default notificationsRoutes;
