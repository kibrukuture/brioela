import { Hono } from 'hono';
import { WEBHOOK_ROUTE_PATTERNS } from '@schnl/shared/api/webhooks.routes';
import { verifyStripeSignature } from '@/core/webhooks/stripe/middleware/verify-stripe-signature';
import { handleStripeWebhook } from '@/core/webhooks/stripe/stripe.controller';

const stripeRoutes = new Hono();

// verify stripe signature
stripeRoutes.use(verifyStripeSignature);

stripeRoutes.post(WEBHOOK_ROUTE_PATTERNS['stripe.webhook'], verifyStripeSignature, handleStripeWebhook);

export default stripeRoutes;
