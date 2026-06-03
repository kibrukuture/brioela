// import '@/instrument';
// import * as Sentry from '@sentry/node';
import '@/core/config/env';
import { Hono, Context } from 'hono';
import { userRouter } from '@/api/users/user.route';
import { API_ROUTES, ENDPOINTS_WITH_NO_AUTH_MIDDLEWARE, HEALTH_CHECK_ROUTES } from '@brioela/shared/api';
import { authMiddleware } from '@/core/middleware/auth';
import { errorHandlerMiddleware } from '@/core/middleware/error-handler';
// import { createRateLimiter } from '@/core/middleware/rate-limiter';

import { healthCheck } from '@/core/middleware/health-check';
import { createCors } from '@/core/middleware/cors';
import paymentRoutes from '@/api/payments/payment.route';
import { devicesRouter } from '@/api/devices/devices.route';
import { cardControlsRouter } from '@/api/card-controls/card-controls.route';
import { cardsRouter } from '@/api/cards/cards.route';
import { mapsRouter } from '@/api/maps/maps.route';
import bankingRouter from '@/api/banking/banking.route';

// cron jobs
// import { cronJobsHandler } from '@/core/jobs';
//

// Webhooks
import webhookRoutes from '@/core/webhooks/webhook.route';

// Queue
import queueRoutes from '@/message-queue/queue.routes';

// temp
import tempRoutes from '@/temp/temp.routes';

// stress test routes
import stressTestRoutes from '@/api/stress-test/stress-test.route';
import { testSentry } from '@/api/stress-test/sentry-test';

import notificationsRoutes from '@/api/notifications/notif.routes';
import availabilityRouter from '@/api/availability/availability.route';
import communicationCodeRoutes from '@/api/communication-codes/communication-code.route';
import { inAppNotificationRouter } from '@/api/in-app-notifications/in-app-notification.route';

// Define environment variables interface

// Define your User type
interface User {
	id: string;
	email: string | null;
}

// Define Hono app with typed environment and variables
export const app = new Hono<{
	Variables: {
		user: User; // This matches what authMiddleware sets with c.set('user', ...)
		alignRawBody?: string;
	};
}>();

// CORS must be first
app.use('*', createCors());

// Apply error handler globally
app.onError(errorHandlerMiddleware);

// 2. Rate limiter (before auth)
// app.use('*', createRateLimiter());

// Apply auth middleware to all routes
app.use('*', authMiddleware({ skipRoutes: ENDPOINTS_WITH_NO_AUTH_MIDDLEWARE }));

// ✅ Mount features
app.route(API_ROUTES.users.base, userRouter);
app.route(API_ROUTES.devices.base, devicesRouter);
app.route(API_ROUTES.cardControls.base, cardControlsRouter);
app.route(API_ROUTES.cards.base, cardsRouter);
app.route(API_ROUTES.maps.base, mapsRouter);

// ✅ Mount webhooks
app.route(API_ROUTES.webhooks['base'], webhookRoutes);

// ✅ Mount queue routes
app.route(API_ROUTES.queue.base, queueRoutes);

// ✅ Mount health check route
app.get(HEALTH_CHECK_ROUTES.base, healthCheck);

app.route(API_ROUTES.payments.base, paymentRoutes);

// Notifications
app.route(API_ROUTES.notifications.base, notificationsRoutes);
app.route(API_ROUTES.inAppNotifications.base, inAppNotificationRouter);
app.route(API_ROUTES.availability.base, availabilityRouter);
app.route(API_ROUTES.banking.base, bankingRouter);
app.route(API_ROUTES.communicationCode.base, communicationCodeRoutes);

// ✅ Mount temporary pingers
app.route(API_ROUTES.queue['temp.base'], tempRoutes);

// ✅ Mount stress test routes
app.route(API_ROUTES.stressTest.base, stressTestRoutes);
app.get(API_ROUTES.stressTest.testSentry, testSentry);

// Sentry.setupHonoErrorHandler(app);

export default app;
export type AppContext = typeof app extends Hono<infer E> ? Context<E> : never;
