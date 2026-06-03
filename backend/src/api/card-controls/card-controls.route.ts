import { Hono } from 'hono';
import * as controller from '@/api/card-controls/card-controls.controller';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';

export const cardControlsRouter = new Hono();

cardControlsRouter.get(API_ROUTE_PATTERNS.cardControls.byCardId, controller.onGetCardControls);
cardControlsRouter.patch(API_ROUTE_PATTERNS.cardControls.byCardId, controller.onUpdateCardControls);
