import { Hono } from 'hono';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';
import stripeRoutes from '@/api/payments/stripe/stripe.routes';

const paymentRoutes = new Hono();

paymentRoutes.route(API_ROUTE_PATTERNS.payments['stripe.base'], stripeRoutes);

export default paymentRoutes;
