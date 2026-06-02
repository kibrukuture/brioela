// ✅ This is SAFE to share - no secrets, no DSN
export interface ErrorContext {
  userId?: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

export type ErrorSeverity = "error" | "warning" | "fatal" | "info";

// Generic interface - the actual Sentry client will be injected
export interface ErrorReporter {
  captureError(
    error: Error,
    context?: ErrorContext,
    severity?: ErrorSeverity
  ): void;
  captureMessage(
    message: string,
    context?: ErrorContext,
    severity?: ErrorSeverity
  ): void;
}

// Generic error handler that works with any reporter
export function createErrorHandler(reporter: ErrorReporter) {
  return {
    captureError(
      error: Error,
      context?: ErrorContext,
      severity: ErrorSeverity = "error"
    ) {
      // Log locally (always)
      console.error("Error:", error, context);

      // Report to external service
      reporter.captureError(error, context, severity);
    },

    captureMessage(
      message: string,
      context?: ErrorContext,
      severity: ErrorSeverity = "info"
    ) {
      console.log("Message:", message, context);
      reporter.captureMessage(message, context, severity);
    },

    // Helper for catching async errors
    async wrapAsync<T>(
      fn: () => Promise<T>,
      context?: ErrorContext
    ): Promise<T> {
      try {
        return await fn();
      } catch (error) {
        this.captureError(
          error instanceof Error ? error : new Error(String(error)),
          context,
          "error"
        );
        throw error;
      }
    },
  };
}
