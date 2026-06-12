# Draft: encore.contract.ts (gap — file does not exist)

Target: `shared/contracts/encore.contract.ts`

```typescript
import { initContract } from '@ts-rest/core'
import { z } from '@brioela/shared/zod'
import { ENCORE_ROUTES } from '@brioela/shared/routes/encore.routes'
import {
	encoreCaptureInputSchema,
	encoreResponseSchema,
} from '@brioela/shared/validator/encore/encore.schema'

const encoreRefineInputSchema = z.object({
	sessionId: z.string(),
	resolutions: z.array(
		z.object({
			questionId: z.string(),
			resolutionNote: z.string(),
		}),
	),
	verdict: z.string().optional(),
	fieldUpdates: z
		.array(
			z.object({
				fieldPath: z.string(),
				newValue: z.string(),
			}),
		)
		.optional(),
})

const c = initContract()

export const encoreContract = c.router({
	createEncore: {
		method: 'POST',
		path: ENCORE_ROUTES.create,
		body: encoreCaptureInputSchema,
		responses: {
			202: z.object({ encoreId: z.string(), status: z.literal('reconstructing') }),
		},
		summary: 'Submit plate photo(s) for Encore reconstruction',
	},
	getEncore: {
		method: 'GET',
		path: ENCORE_ROUTES.getById(':encoreId'),
		pathParams: z.object({ encoreId: z.string() }),
		responses: {
			200: encoreResponseSchema,
		},
		summary: 'Reconstruction status and draft recipe',
	},
	refineEncore: {
		method: 'POST',
		path: ENCORE_ROUTES.refine(':encoreId'),
		pathParams: z.object({ encoreId: z.string() }),
		body: encoreRefineInputSchema,
		responses: {
			200: encoreResponseSchema,
		},
		summary: 'Post-cook refinement from Mira session',
	},
})
```
