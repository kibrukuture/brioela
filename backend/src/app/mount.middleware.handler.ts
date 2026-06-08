import { createCors } from '@/core/middleware/cors'
import { authMiddleware } from '@/core/middleware/auth'
import { errorHandlerMiddleware } from '@/core/middleware/error-handler'
import { ENDPOINTS_WITH_NO_AUTH_MIDDLEWARE } from '@brioela/shared/api'
import type { Hono } from 'hono'
import type { AppEnvironment } from '@/app/context.type'

export function mountMiddleware(app: Hono<AppEnvironment>): void {
	app.use('*', createCors())
	app.onError(errorHandlerMiddleware)
	app.use('*', authMiddleware({ skipRoutes: ENDPOINTS_WITH_NO_AUTH_MIDDLEWARE }))
}
