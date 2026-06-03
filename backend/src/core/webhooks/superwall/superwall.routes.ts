import { Hono } from 'hono';
import { handleSuperwallWebhook } from '@/core/webhooks/superwall/superwall.controller';
import { verifySuperwallWebhook } from '@/core/webhooks/superwall/middleware/verify-superwall-signature';
import { WEBHOOK_ROUTE_PATTERNS } from '@brioela/shared/api/webhooks.routes';

const superwallRoutes = new Hono();

superwallRoutes.use(verifySuperwallWebhook);

// Webhook endpoint
superwallRoutes.post(WEBHOOK_ROUTE_PATTERNS['superwall.webhook'], handleSuperwallWebhook);

export default superwallRoutes;
