import { Hono } from 'hono';
import * as controller from '@/api/devices/devices.controller';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';

export const devicesRouter = new Hono();

devicesRouter.post(API_ROUTE_PATTERNS.devices.bind, controller.onBindDevice);
devicesRouter.post(API_ROUTE_PATTERNS.devices.verify, controller.onVerifyDevice);
devicesRouter.post(API_ROUTE_PATTERNS.devices.unbind, controller.onUnbindDevice);
