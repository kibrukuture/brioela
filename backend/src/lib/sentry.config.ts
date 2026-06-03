import * as Sentry from '@sentry/node';
import { ErrorReporter, ErrorContext, ErrorSeverity } from '@brioela/shared/error-handlers/sentry';

// Backend-specific error reporter
export const backendErrorReporter: ErrorReporter = {
	captureError(error: Error, context?: ErrorContext, severity: ErrorSeverity = 'error') {
		Sentry.withScope((scope) => {
			scope.setLevel(severity);
			if (context?.userId) {
				scope.setUser({ id: context.userId });
			}
			if (context?.tags) {
				Object.entries(context.tags).forEach(([key, value]) => {
					scope.setTag(key, value);
				});
			}
			if (context?.metadata) {
				scope.setContext('metadata', context.metadata);
			}
			Sentry.captureException(error);
		});
	},

	captureMessage(message: string, context?: ErrorContext, severity: ErrorSeverity = 'info') {
		Sentry.withScope((scope) => {
			scope.setLevel(severity);
			if (context?.metadata) {
				scope.setContext('metadata', context.metadata);
			}
			Sentry.captureMessage(message);
		});
	},
};
