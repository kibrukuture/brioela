// Success response wrapper
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    timestamp: number;
    requestId: string;
  };
}

// Paginated response wrapper
export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
    timestamp: number;
    requestId: string;
  };
}

// Error response
export interface ApiErrorResponse {
  error: {
    code: number;
    message: string;
    details?: unknown;
    timestamp: number;
    requestId: string;
  };
}

// // Error codes (enum for consistency)
// export const ErrorCode = {
//   // Auth errors
//   UNAUTHORIZED: "UNAUTHORIZED",
//   FORBIDDEN: "FORBIDDEN",
//   TOKEN_EXPIRED: "TOKEN_EXPIRED",
//   TOKEN_INVALID: "TOKEN_INVALID",

//   // Request errors
//   BAD_REQUEST: "BAD_REQUEST",
//   METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
//   UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
//   PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
//   RATE_LIMITED: "RATE_LIMITED",
//   TIMEOUT: "TIMEOUT",
//   CONFLICT: "CONFLICT",
//   PRECONDITION_FAILED: "PRECONDITION_FAILED",

//   // Validation errors
//   VALIDATION_ERROR: "VALIDATION_ERROR",
//   INVALID_INPUT: "INVALID_INPUT",
//   UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",

//   // Resource errors
//   NOT_FOUND: "NOT_FOUND",
//   ALREADY_EXISTS: "ALREADY_EXISTS",

//   // Server errors
//   INTERNAL_ERROR: "INTERNAL_ERROR",
//   SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
//   NOT_IMPLEMENTED: "NOT_IMPLEMENTED",
//   BAD_GATEWAY: "BAD_GATEWAY",
//   GATEWAY_TIMEOUT: "GATEWAY_TIMEOUT",

//   // Provider / upstream errors
//   UPSTREAM_ERROR: "UPSTREAM_ERROR",

//   // Business logic errors
//   PROCESSING_FAILED: "PROCESSING_FAILED",
//   EXTRACTION_FAILED: "EXTRACTION_FAILED",
//   INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
//   LIMIT_EXCEEDED: "LIMIT_EXCEEDED",
// } as const;

export const ErrorCode = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 401,

  BAD_REQUEST: 400,
  METHOD_NOT_ALLOWED: 405,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,

  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  UNPROCESSABLE_ENTITY: 422,

  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,

  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  GATEWAY_TIMEOUT: 504,

  UPSTREAM_ERROR: 502,

  PROCESSING_FAILED: 500,
  EXTRACTION_FAILED: 500,
  INSUFFICIENT_FUNDS: 400,
  LIMIT_EXCEEDED: 429,
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export default class ApiError extends Error {
  code: number;
  details?: string;
  timestamp: number;
  requestId: string;

  constructor(apiErrorResponse: ApiErrorResponse) {
    super(apiErrorResponse.error.message);
    this.name = "ApiError";
    this.code = apiErrorResponse.error.code;
    this.details =
      typeof apiErrorResponse.error.details === "string"
        ? apiErrorResponse.error.details
        : String(apiErrorResponse.error.details);
    this.timestamp = apiErrorResponse.error.timestamp;
    this.requestId = apiErrorResponse.error.requestId;
  }
}
