# Draft: passport.contract.ts (gap — file does not exist)

Target: `shared/contracts/passport.contract.ts`

**Gap (feature 47):** ts-rest contract spine entry — `passport.create` per grammar hardening doc.

**Source:** `build-guide/27-generative-grammar/21-contract-spine-hardening.md`

---

```typescript
import { initContract } from '@ts-rest/core'
import {
	passportCreateRequestSchema,
	passportPreviewRequestSchema,
	passportResponseSchema,
} from '@brioela/shared/validator/passport/passport.schema'
import { z } from 'zod'

const c = initContract()

export const passportContract = c.router({
	preview: {
		method: 'POST',
		path: '/api/passport/preview',
		body: passportPreviewRequestSchema,
		responses: {
			200: z.object({
				instructionBlocks: z.array(
					z.object({
						heading: z.string(),
						lines: z.array(z.string()),
						severity: z.enum(['info', 'ask', 'avoid', 'critical']),
					}),
				),
				sensitivity: z.enum(['public_safe', 'limited_sensitive', 'blocked']),
				suggestedExpiresAt: z.number(),
			}),
		},
	},
	create: {
		method: 'POST',
		path: '/api/passport/create',
		body: passportCreateRequestSchema,
		responses: {
			200: passportResponseSchema,
		},
	},
	revoke: {
		method: 'POST',
		path: '/api/passport/:passportId/revoke',
		pathParams: z.object({ passportId: z.string() }),
		body: z.object({}),
		responses: {
			200: z.object({ revoked: z.boolean() }),
		},
	},
})
```
