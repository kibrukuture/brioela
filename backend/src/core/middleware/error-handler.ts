import { HTTPException } from 'hono/http-exception';
import { apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import { normalizeUnknownError } from '@/core/errors/normalize-unknown-error';

function jsonErrorResponse(payload: unknown, status: number): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}

export const errorHandlerMiddleware = (e: Error): Response => {
	console.log('errorHandlerMiddleware instanceof HTTPException', e instanceof HTTPException, e.message);
	if (e instanceof HTTPException) {
		switch (e.status) {
			case ErrorCode.BAD_REQUEST:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.BAD_REQUEST, e?.message, e),
					ErrorCode.BAD_REQUEST
				);
			case ErrorCode.UNAUTHORIZED:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.UNAUTHORIZED, e?.message, e),
					ErrorCode.UNAUTHORIZED
				);
			case ErrorCode.FORBIDDEN:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.FORBIDDEN, e?.message, e),
					ErrorCode.FORBIDDEN
				);
			case ErrorCode.NOT_FOUND:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.NOT_FOUND, e?.message, e),
					ErrorCode.NOT_FOUND
				);
			case ErrorCode.METHOD_NOT_ALLOWED:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.METHOD_NOT_ALLOWED, e?.message, e),
					ErrorCode.METHOD_NOT_ALLOWED
				);
			case ErrorCode.TIMEOUT:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.CONFLICT, e?.message, e),
					ErrorCode.CONFLICT
				);
			case ErrorCode.PRECONDITION_FAILED:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.PRECONDITION_FAILED, e?.message, e),
					ErrorCode.PRECONDITION_FAILED
				);
			case ErrorCode.PAYLOAD_TOO_LARGE:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.PAYLOAD_TOO_LARGE, e?.message, e),
					ErrorCode.PAYLOAD_TOO_LARGE
				);
			case ErrorCode.UNSUPPORTED_MEDIA_TYPE:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.UNSUPPORTED_MEDIA_TYPE, e?.message, e),
					ErrorCode.UNSUPPORTED_MEDIA_TYPE
				);
			case ErrorCode.UNPROCESSABLE_ENTITY:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.UNPROCESSABLE_ENTITY, e?.message, e),
					ErrorCode.UNPROCESSABLE_ENTITY
				);
			case ErrorCode.RATE_LIMITED:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.RATE_LIMITED, e?.message, e),
					ErrorCode.RATE_LIMITED
				);
			case ErrorCode.INTERNAL_ERROR:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.INTERNAL_ERROR, e?.message, e),
					ErrorCode.INTERNAL_ERROR
				);
			case ErrorCode.NOT_IMPLEMENTED:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.NOT_IMPLEMENTED, e?.message, e),
					ErrorCode.NOT_IMPLEMENTED
				);
			case ErrorCode.BAD_GATEWAY:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.BAD_GATEWAY, e?.message, e),
					ErrorCode.BAD_GATEWAY
				);
			case ErrorCode.SERVICE_UNAVAILABLE:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.SERVICE_UNAVAILABLE, e?.message, e),
					ErrorCode.SERVICE_UNAVAILABLE
				);
			case ErrorCode.GATEWAY_TIMEOUT:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.GATEWAY_TIMEOUT, e?.message, e),
					ErrorCode.GATEWAY_TIMEOUT
				);
			default:
				return jsonErrorResponse(
					//
					apiErrorResponse(ErrorCode.INTERNAL_ERROR, e?.message, e),
					ErrorCode.INTERNAL_ERROR
				);
		}
	}

	const normalizedUnknown = normalizeUnknownError(e);
	return jsonErrorResponse(
		apiErrorResponse(normalizedUnknown.code, normalizedUnknown.message, normalizedUnknown.details),
		normalizedUnknown.status
	);
};
