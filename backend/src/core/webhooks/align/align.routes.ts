import { Hono } from 'hono';
import { WEBHOOK_ROUTE_PATTERNS } from '@brioela/shared/api/webhooks.routes';
import { verifyAlignSignature } from '@/core/webhooks/align/middleware/verify-align-signature';
import { onAlignWebhook } from '@/core/webhooks/align/align.controller';

const alignRoutes = new Hono();

alignRoutes.use(verifyAlignSignature);

alignRoutes.post(WEBHOOK_ROUTE_PATTERNS['align.webhook'], onAlignWebhook);

export default alignRoutes;
