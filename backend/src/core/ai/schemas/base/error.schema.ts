import { z } from '@schnl/shared/zod';

export const AIErrorSchema = z.object({
	error_code: z.string().describe('Machine-readable error code'),
	error_message: z.string().describe('Human-readable error message'),
	retryable: z.boolean().describe('Whether this error can be retried'),
	suggested_action: z.string().nullable().describe('What to do next'),
	context: z.record(z.string(), z.any()).nullable().describe('Additional error context'),
});
