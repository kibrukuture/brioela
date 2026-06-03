/**
 * Type guard to check if value is an Error instance
 */
export function isError(value: unknown): value is Error {
	return value instanceof Error;
}

/**
 * Safely get error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
	if (isError(error)) {
		return error.message;
	}
	if (typeof error === 'string') {
		return error;
	}
	if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
		return error.message;
	}
	return String(error);
}

/**
 * Safely convert unknown error to Error instance
 */
export function toError(error: unknown): Error {
	if (isError(error)) {
		return error;
	}
	return { name: 'Error', message: getErrorMessage(error) } as Error;
}
