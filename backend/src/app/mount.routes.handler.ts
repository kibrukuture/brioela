import availabilityRouter from '@/api/availability/availability.route'
import bankingRouter from '@/api/banking/banking.route'
import { cardControlsRouter } from '@/api/card-controls/card-controls.route'
import { cardsRouter } from '@/api/cards/cards.route'
import communicationCodeRoutes from '@/api/communication-codes/communication-code.route'
import { devicesRouter } from '@/api/devices/devices.route'
import { inAppNotificationRouter } from '@/api/in-app-notifications/in-app-notification.route'
import { mapsRouter } from '@/api/maps/maps.route'
import notificationsRoutes from '@/api/notifications/notif.routes'
import paymentRoutes from '@/api/payments/payment.route'
import stressTestRoutes from '@/api/stress-test/stress-test.route'
import { testSentry } from '@/api/stress-test/sentry-test'
import { userRouter } from '@/api/users/user.route'
import { healthCheck } from '@/core/middleware/health-check'
import webhookRoutes from '@/core/webhooks/webhook.route'
import queueRoutes from '@/message-queue/queue.routes'
import tempRoutes from '@/temp/temp.routes'
import { API_ROUTES, HEALTH_CHECK_ROUTES } from '@brioela/shared/api'
import type { Hono } from 'hono'
import type { AppEnvironment } from '@/app/context.type'

export function mountRoutes(app: Hono<AppEnvironment>): void {
	app.route(API_ROUTES.users.base, userRouter)
	app.route(API_ROUTES.devices.base, devicesRouter)
	app.route(API_ROUTES.cardControls.base, cardControlsRouter)
	app.route(API_ROUTES.cards.base, cardsRouter)
	app.route(API_ROUTES.maps.base, mapsRouter)
	app.route(API_ROUTES.webhooks.base, webhookRoutes)
	app.route(API_ROUTES.queue.base, queueRoutes)
	app.get(HEALTH_CHECK_ROUTES.base, healthCheck)
	app.route(API_ROUTES.payments.base, paymentRoutes)
	app.route(API_ROUTES.notifications.base, notificationsRoutes)
	app.route(API_ROUTES.inAppNotifications.base, inAppNotificationRouter)
	app.route(API_ROUTES.availability.base, availabilityRouter)
	app.route(API_ROUTES.banking.base, bankingRouter)
	app.route(API_ROUTES.communicationCode.base, communicationCodeRoutes)
	app.route(API_ROUTES.queue['temp.base'], tempRoutes)
	app.route(API_ROUTES.stressTest.base, stressTestRoutes)
	app.get(API_ROUTES.stressTest.testSentry, testSentry)
}
