import { Hono } from 'hono';
import { createBillingPortalSession, createTopupIntent } from '@/api/payments/stripe/stripe.controller';
import { PAYMENTS_ROUTE_PATTERNS } from '@brioela/shared/api/payments.routes';

const stripeRoutes = new Hono();

stripeRoutes.post(PAYMENTS_ROUTE_PATTERNS['stripe.create-billing-portal-session'], createBillingPortalSession);
stripeRoutes.post(PAYMENTS_ROUTE_PATTERNS['stripe.create-topup-intent'], createTopupIntent);

export default stripeRoutes;
