import * as Sentry from '@sentry/node';
import { env } from '@/core/config/env';

Sentry.init({
	dsn: env.SENTRY_DSN_BACKEND,
	environment: env.ENVIRONMENT || 'production',
	tracesSampleRate: 1.0,
});
