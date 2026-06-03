import { Hono } from 'hono';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';
import superwallRoutes from '@/core/webhooks/superwall/superwall.routes';
import stripeRoutes from '@/api/payments/stripe/stripe.routes';
import alignRoutes from '@/core/webhooks/align/align.routes';

const webhookRoutes = new Hono();

webhookRoutes.route(API_ROUTE_PATTERNS.webhooks['stripe.base'], stripeRoutes);
webhookRoutes.route(API_ROUTE_PATTERNS.webhooks['superwall.base'], superwallRoutes);
webhookRoutes.route(API_ROUTE_PATTERNS.webhooks['align.base'], alignRoutes);

export default webhookRoutes;
