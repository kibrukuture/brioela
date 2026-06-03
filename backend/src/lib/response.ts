import { ApiSuccessResponse, ApiPaginatedResponse, ApiErrorResponse, ErrorCodeType, ErrorCode } from '@schnl/shared/types/api';
import { ZodError } from '@schnl/shared/zod';

// Generate unique request ID
function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// Success response helper
export function apiSuccessResponse<T>(data: T): ApiSuccessResponse<T> {
	return {
		data,
		meta: {
			timestamp: Date.now(),
			requestId: generateRequestId(),
		},
	};
}

// Paginated response helper
export function apiPaginatedResponse<T>(
	data: T[],
	options: {
		total: number;
		page: number;
		pageSize: number;
	}
): ApiPaginatedResponse<T> {
	const { total, page, pageSize } = options;
	const hasMore = page * pageSize < total;

	return {
		data,
		meta: {
			total,
			page,
			pageSize,
			hasMore,
			timestamp: Date.now(),
			requestId: generateRequestId(),
		},
	};
}

// Error response helper
export function apiErrorResponse(code: ErrorCodeType, message: string, details?: unknown): ApiErrorResponse {
	return {
		error: {
			code,
			message,
			details,
			timestamp: Date.now(),
			requestId: generateRequestId(),
		},
	};
}

export function apiValidationError<T>(zodError: ZodError<T>): ApiErrorResponse {
	const details = zodError.issues.reduce((acc, err) => {
		const path = err.path.join('.');
		acc[path] = err.message;
		return acc;
	}, {} as Record<string, string>);

	return apiErrorResponse(ErrorCode.VALIDATION_ERROR, 'Validation failed', details);
}
