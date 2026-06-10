import { z } from '@brioela/shared/zod'

export const readUserMemorySchema = z.object({
	namespace: z.string()
		.regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){0,2}$/, 'namespace must be dot-separated lowercase, max 3 levels')
		.describe('Which namespace to read from.'),
	key: z.string()
		.regex(/^[a-z][a-z0-9_]*$/, 'key must be lowercase with underscores only')
		.optional()
		.describe('Which key to read within the namespace. If omitted, returns all namespace keys.'),
})
