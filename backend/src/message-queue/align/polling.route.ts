import { Hono } from 'hono';
import * as controller from '@/message-queue/align/polling.controller';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';

export const alignPollingRouter = new Hono();

alignPollingRouter.post(API_ROUTE_PATTERNS.queue['align.polling.events'], controller.onPollingJob);
