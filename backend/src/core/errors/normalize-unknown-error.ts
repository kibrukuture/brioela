// import { ErrorCode, type ErrorCodeType } from '@schnl/shared/types/api';
// import sanitizePgError from '@/core/errors/sanitize-pg-error';

// function isPgError(error: unknown) {
// 	if (!error || typeof error !== 'object') return false;
// 	const e = error as any;

// 	// MUST have these Postgres-specific fields together
// 	return (
// 		typeof e.severity === 'string' && typeof e.code === 'string' && e.code.length === 5 && ('file' in e || 'routine' in e || 'detail' in e)
// 	);
// }

// export function normalizeUnknownError(error: unknown): {
// 	status: number;
// 	code: ErrorCodeType;
// 	message: string;
// 	details?: unknown;
// } {
// 	// Check if it's a Postgres error FIRST
// 	if (isPgError(error)) {
// 		return {
// 			status: ErrorCode.INTERNAL_ERROR,
// 			code: ErrorCode.INTERNAL_ERROR,
// 			message: sanitizePgError(error),
// 			details: process.env.NODE_ENV === 'production' ? undefined : error,
// 		};
// 	}

// 	// Generic Error
// 	if (error instanceof Error) {
// 		return {
// 			status: ErrorCode.INTERNAL_ERROR,
// 			code: ErrorCode.INTERNAL_ERROR,
// 			message: error.message,
// 			details: error.message,
// 		};
// 	}

// 	// Unknown type
// 	return {
// 		status: ErrorCode.INTERNAL_ERROR,
// 		code: ErrorCode.INTERNAL_ERROR,
// 		message: 'Internal Server Error',
// 		details: typeof error === 'string' ? error : 'An unexpected error occurred',
// 	};
// }

import { ErrorCode, type ErrorCodeType } from '@schnl/shared/types/api';

/**
 * Complete PostgreSQL Error Structure based on Protocol Documentation
 * @see https://www.postgresql.org/docs/current/protocol-error-fields.html
 */
interface PostgresError {
	// Always present fields
	severity?: 'ERROR' | 'FATAL' | 'PANIC' | 'WARNING' | 'NOTICE' | 'DEBUG' | 'INFO' | 'LOG';
	code?: string; // 5-character SQLSTATE code
	message?: string; // Primary error message

	// Optional detailed fields
	detail?: string; // Secondary error message with more detail
	hint?: string; // Suggestion on how to fix
	position?: string; // Error position in query
	internalPosition?: string; // Position in internal query
	internalQuery?: string; // Failed internal SQL command
	where?: string; // Context where error occurred (stack trace)

	// Database object identification
	schema?: string; // Schema name
	table?: string; // Table name
	column?: string; // Column name
	dataType?: string; // Data type name
	constraint?: string; // Constraint name

	// Source code location (DANGEROUS - never expose)
	file?: string; // PostgreSQL source file
	line?: string; // Line number in source
	routine?: string; // Function name in source
}

/**
 * SQLSTATE Error Code Classes
 * First 2 characters = error class, Last 3 = specific condition
 */
const SQLSTATE_CLASSES = {
	'00': 'Successful Completion',
	'01': 'Warning',
	'02': 'No Data',
	'03': 'SQL Statement Not Yet Complete',
	'08': 'Connection Exception',
	'09': 'Triggered Action Exception',
	'0A': 'Feature Not Supported',
	'0B': 'Invalid Transaction Initiation',
	'0F': 'Locator Exception',
	'0L': 'Invalid Grantor',
	'0P': 'Invalid Role Specification',
	'0Z': 'Diagnostics Exception',
	'10': 'XQuery Error',
	'20': 'Case Not Found',
	'21': 'Cardinality Violation',
	'22': 'Data Exception',
	'23': 'Integrity Constraint Violation',
	'24': 'Invalid Cursor State',
	'25': 'Invalid Transaction State',
	'26': 'Invalid SQL Statement Name',
	'27': 'Triggered Data Change Violation',
	'28': 'Invalid Authorization Specification',
	'2B': 'Dependent Privilege Descriptors Still Exist',
	'2D': 'Invalid Transaction Termination',
	'2F': 'SQL Routine Exception',
	'34': 'Invalid Cursor Name',
	'38': 'External Routine Exception',
	'39': 'External Routine Invocation Exception',
	'3B': 'Savepoint Exception',
	'3D': 'Invalid Catalog Name',
	'3F': 'Invalid Schema Name',
	'40': 'Transaction Rollback',
	'42': 'Syntax Error or Access Rule Violation',
	'44': 'WITH CHECK OPTION Violation',
	'53': 'Insufficient Resources',
	'54': 'Program Limit Exceeded',
	'55': 'Object Not In Prerequisite State',
	'57': 'Operator Intervention',
	'58': 'System Error',
	F0: 'Configuration File Error',
	HV: 'Foreign Data Wrapper Error',
	P0: 'PL/pgSQL Error',
	XX: 'Internal Error',
} as const;

/**
 * Common SQLSTATE codes with user-friendly messages
 * These are the most frequently encountered errors
 */
const SQLSTATE_MESSAGES: Record<string, string> = {
	// Class 23: Integrity Constraint Violation
	'23000': 'Database constraint violation',
	'23001': 'Restriction violation',
	'23502': 'Required field is missing',
	'23503': 'Related record not found',
	'23505': 'This record already exists',
	'23514': 'Data validation failed',
	'23P01': 'Exclusion constraint violated',

	// Class 22: Data Exception
	'22000': 'Invalid data format',
	'22001': 'Value too long for field',
	'22003': 'Number out of valid range',
	'22007': 'Invalid date or time format',
	'22008': 'Date or time overflow',
	'22012': 'Division by zero',
	'22018': 'Invalid character for conversion',
	'22P02': 'Invalid input syntax',
	'22P03': 'Invalid binary data',

	// Class 42: Syntax/Access Errors
	'42000': 'Query syntax error or access denied',
	'42501': 'Insufficient privileges',
	'42601': 'SQL syntax error',
	'42703': 'Column not found',
	'42704': 'Object not found',
	'42710': 'Object already exists',
	'42P01': 'Table not found',
	'42883': 'Function not found',

	// Class 40: Transaction Issues
	'40000': 'Transaction was rolled back',
	'40001': 'Transaction conflict - please retry',
	'40P01': 'Deadlock detected',

	// Class 28: Authentication
	'28000': 'Authentication failed',
	'28P01': 'Invalid password',

	// Class 08: Connection Issues
	'08000': 'Connection error',
	'08003': 'Connection does not exist',
	'08006': 'Connection failed',

	// Class 53: Resource Issues
	'53000': 'Insufficient server resources',
	'53100': 'Server disk is full',
	'53200': 'Server out of memory',
	'53300': 'Too many connections',

	// Class 57: Operator Intervention
	'57000': 'Operation was interrupted',
	'57014': 'Query was cancelled',
	'57P01': 'Server is shutting down',

	// Class P0: PL/pgSQL
	P0001: 'Database operation failed',
	P0002: 'No data found',
	P0003: 'Too many rows returned',
};

/**
 * Sensitive patterns that should NEVER appear in client-facing error messages
 */
const SENSITIVE_PATTERNS = {
	// File paths
	filePaths: /\/[\w\/.\\-]+\.(c|h|ts|js|sql|py|rb|go):\d+/gi,

	// Function/routine names from source code
	routineNames: /\bat\s+[\w_]+\s*\(/gi,

	// PostgreSQL internal references
	postgresInternals: /\b(parserOpenTable|ExecConstraints|heap_insert|btree_insert)\b/gi,

	// Connection strings
	connectionStrings: /(postgres|postgresql):\/\/[^\s]+/gi,

	// IP addresses
	ipAddresses: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,

	// Port numbers in contexts like "localhost:5432"
	ports: /:\d{4,5}\b/g,

	// Server paths
	serverPaths: /\b[A-Z]:\\[\w\\-]+|\b\/(?:var|usr|opt|home)\/[\w\/-]+/g,
};

/**
 * Database identifiers that leak schema information
 */
const DATABASE_IDENTIFIER_PATTERNS = {
	// Quoted identifiers: "table_name", "column_name"
	quotedIdentifiers: /"[\w_]+"/g,

	// Schema.table references
	schemaTable: /\b[\w_]+\.[\w_]+\b/g,

	// Index names (usually end with _idx, _pkey, _fkey)
	indexNames: /\b[\w_]+_(idx|pkey|fkey|key|check|excl)\b/gi,
};

/**
 * Check if error is from PostgreSQL by examining its structure
 */
export function isPostgresError(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;

	const e = error as any;

	// Must have core PostgreSQL error fields
	const hasSeverity =
		typeof e.severity === 'string' && ['ERROR', 'FATAL', 'PANIC', 'WARNING', 'NOTICE', 'DEBUG', 'INFO', 'LOG'].includes(e.severity);

	const hasValidCode = typeof e.code === 'string' && e.code.length === 5;

	// Must have at least one PostgreSQL-specific field
	const hasPgSpecificField =
		'file' in e || 'routine' in e || 'detail' in e || 'constraint' in e || 'schema' in e || 'table' in e || 'where' in e;

	return hasSeverity && hasValidCode && hasPgSpecificField;
}

/**
 * Extract SQLSTATE error class (first 2 characters)
 */
function getSqlStateClass(code: string): string {
	if (code.length !== 5) return '';
	return code.substring(0, 2);
}

/**
 * Get user-friendly message from SQLSTATE code
 */
function getMessageFromSqlState(code: string): string | null {
	// Try exact code match first
	if (SQLSTATE_MESSAGES[code]) {
		return SQLSTATE_MESSAGES[code];
	}

	// Fall back to error class
	const errorClass = getSqlStateClass(code);
	const className = SQLSTATE_CLASSES[errorClass as keyof typeof SQLSTATE_CLASSES];

	if (className) {
		return className;
	}

	return null;
}

/**
 * Remove all sensitive information from a string
 */
function stripSensitiveInfo(text: string): string {
	let cleaned = text;

	// Remove all sensitive patterns
	Object.values(SENSITIVE_PATTERNS).forEach((pattern) => {
		cleaned = cleaned.replace(pattern, '');
	});

	return cleaned.trim();
}

/**
 * Clean database identifiers while preserving meaning
 */
function sanitizeDatabaseIdentifiers(text: string): string {
	let cleaned = text;

	// Replace quoted identifiers with generic terms
	cleaned = cleaned.replace(/"[\w_]+"/g, (match) => {
		const identifier = match.slice(1, -1).toLowerCase();

		// Try to infer what kind of identifier it is
		if (identifier.includes('_id') || identifier === 'id') return 'identifier';
		if (identifier.includes('name')) return 'name';
		if (identifier.includes('email')) return 'email';
		if (identifier.includes('password')) return 'credential';
		if (identifier.includes('token')) return 'token';
		if (identifier.includes('key')) return 'key';
		if (identifier.includes('date') || identifier.includes('time')) return 'timestamp';
		if (identifier.includes('amount') || identifier.includes('price')) return 'amount';
		if (identifier.includes('count')) return 'count';

		// Generic fallback
		return 'field';
	});

	// Remove schema.table references
	cleaned = cleaned.replace(/\b[\w_]+\.[\w_]+\b/g, 'table');

	// Remove constraint names
	cleaned = cleaned.replace(/\b[\w_]+_(idx|pkey|fkey|key|check|excl)\b/gi, 'constraint');

	return cleaned;
}

/**
 * Process error message field
 * This contains the primary error description
 */
function processMessage(pgError: PostgresError): string {
	if (!pgError.message) return 'Database operation failed';

	let message = pgError.message;

	// First, try to get a pre-defined user-friendly message
	if (pgError.code) {
		const friendlyMessage = getMessageFromSqlState(pgError.code);
		if (friendlyMessage) {
			// For constraint violations, we might want to be more specific
			if (pgError.code.startsWith('23') && pgError.constraint) {
				// Constraint error - we can be a bit more helpful
				return friendlyMessage;
			}
			return friendlyMessage;
		}
	}

	// Clean the actual message
	message = stripSensitiveInfo(message);
	message = sanitizeDatabaseIdentifiers(message);

	// Remove any remaining noise
	message = message.replace(/\s+/g, ' ').trim();

	return message || 'Database operation failed';
}

/**
 * Process detail field
 * Contains additional context but often has sensitive data
 */
function processDetail(detail: string | undefined): string | undefined {
	if (!detail) return undefined;

	// In production, NEVER return detail as it often contains user data
	if (process.env.NODE_ENV === 'production') {
		return undefined;
	}

	// In development, sanitize it
	let cleaned = stripSensitiveInfo(detail);
	cleaned = sanitizeDatabaseIdentifiers(cleaned);
	cleaned = cleaned.replace(/\s+/g, ' ').trim();

	return cleaned || undefined;
}

/**
 * Build safe error metadata for logging/debugging
 */
function buildSafeMetadata(pgError: PostgresError): Record<string, any> {
	const metadata: Record<string, any> = {
		errorClass: pgError.code ? getSqlStateClass(pgError.code) : undefined,
		sqlState: pgError.code,
		severity: pgError.severity,
	};

	// Include constraint info if present (useful for debugging)
	if (pgError.constraint) {
		metadata.constraintType = pgError.constraint;
	}

	// Include affected object types (not names)
	if (pgError.schema) metadata.hasSchema = true;
	if (pgError.table) metadata.hasTable = true;
	if (pgError.column) metadata.hasColumn = true;
	if (pgError.dataType) metadata.hasDataType = true;

	return metadata;
}

/**
 * Main error sanitizer for PostgreSQL errors
 * Processes all fields according to PostgreSQL protocol documentation
 */
export function sanitizePostgresError(error: unknown): {
	message: string;
	code: string;
	severity: string;
	hint?: string;
	metadata?: Record<string, any>;
} {
	const pgError = error as PostgresError;

	// Process the primary message
	const safeMessage = processMessage(pgError);

	// Process hint if available (usually safe, but sanitize anyway)
	let safeHint: string | undefined;
	if (pgError.hint) {
		safeHint = stripSensitiveInfo(pgError.hint);
		safeHint = sanitizeDatabaseIdentifiers(safeHint);
	}

	// Build metadata for internal logging
	const metadata = buildSafeMetadata(pgError);

	return {
		message: safeMessage,
		code: pgError.code || '99999',
		severity: pgError.severity || 'ERROR',
		hint: safeHint,
		metadata: process.env.NODE_ENV === 'production' ? undefined : metadata,
	};
}

/**
 * Main entry point for normalizing unknown errors
 */
export function normalizeUnknownError(error: unknown): {
	status: number;
	code: ErrorCodeType;
	message: string;
	details?: unknown;
} {
	// Check if it's a PostgreSQL error FIRST
	if (isPostgresError(error)) {
		const sanitized = sanitizePostgresError(error);

		return {
			status: ErrorCode.INTERNAL_ERROR,
			code: ErrorCode.INTERNAL_ERROR,
			message: sanitized.message,
			details: process.env.NODE_ENV === 'production' ? undefined : sanitized.metadata,
		};
	}

	// Generic Error handling
	if (error instanceof Error) {
		// Still sanitize generic errors in case they contain PG info
		let message = error.message;
		message = stripSensitiveInfo(message);
		message = sanitizeDatabaseIdentifiers(message);

		return {
			status: ErrorCode.INTERNAL_ERROR,
			code: ErrorCode.INTERNAL_ERROR,
			message: message || 'An error occurred',
			details: process.env.NODE_ENV === 'production' ? undefined : error.message,
		};
	}

	// Unknown error type
	return {
		status: ErrorCode.INTERNAL_ERROR,
		code: ErrorCode.INTERNAL_ERROR,
		message: 'Internal Server Error',
		details: typeof error === 'string' ? error : 'An unexpected error occurred',
	};
}

/**
 * Utility: Get human-readable description of SQLSTATE code
 * Useful for internal logging
 */
export function describeSqlState(code: string): string {
	if (code.length !== 5) return 'Invalid SQLSTATE code';

	const specific = SQLSTATE_MESSAGES[code];
	if (specific) return specific;

	const errorClass = getSqlStateClass(code);
	const className = SQLSTATE_CLASSES[errorClass as keyof typeof SQLSTATE_CLASSES];

	return className || 'Unknown error class';
}

/**
 * Utility: Check if SQLSTATE indicates a client error (4xx equivalent)
 */
export function isClientError(code: string): boolean {
	const errorClass = getSqlStateClass(code);
	// Class 22 (data exception), 23 (integrity), 42 (syntax/access)
	return ['22', '23', '42'].includes(errorClass);
}

/**
 * Utility: Check if SQLSTATE indicates a server error (5xx equivalent)
 */
export function isServerError(code: string): boolean {
	const errorClass = getSqlStateClass(code);
	// Class 53 (resources), 54 (limits), 57 (operator), 58 (system), XX (internal)
	return ['53', '54', '57', '58', 'XX'].includes(errorClass);
}
