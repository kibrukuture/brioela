# Draft: heirloom.contract.ts (gap — file does not exist)

Target: `shared/contracts/heirloom.contract.ts`

---

```typescript
import { initContract } from '@ts-rest/core'
import { z } from '@brioela/shared/zod'
import { HEIRLOOM_ROUTES } from '@brioela/shared/routes/heirloom.routes'
import {
	heirloomAssembleInputSchema,
	heirloomSchema,
} from '@brioela/shared/validator/heirloom/heirloom.schema'

const c = initContract()

export const heirloomContract = c.router({
	assemble: {
		method: 'POST',
		path: HEIRLOOM_ROUTES.assemble,
		body: heirloomAssembleInputSchema,
		responses: {
			201: z.object({ heirloomId: z.string(), version: z.number() }),
		},
	},
	invite: {
		method: 'POST',
		path: HEIRLOOM_ROUTES.invite,
		body: z.object({ inviteeContact: z.string() }),
		responses: {
			201: z.object({
				invitationId: z.string(),
				shareUrl: z.string().url(),
				expiresAt: z.number(),
			}),
		},
	},
	accept: {
		method: 'POST',
		path: HEIRLOOM_ROUTES.accept,
		body: z.object({ inviteeContact: z.string() }),
		responses: {
			200: z.object({ heirloomId: z.string(), status: z.literal('delivered') }),
		},
	},
	push: {
		method: 'POST',
		path: HEIRLOOM_ROUTES.push,
		body: z.object({
			itemType: z.enum(['recipe', 'style_profile', 'moment']),
			localRef: z.string(),
			ownerNote: z.string().optional(),
		}),
		responses: {
			200: z.object({ version: z.number(), recipientPromptCount: z.number() }),
		},
	},
	successor: {
		method: 'POST',
		path: HEIRLOOM_ROUTES.successor,
		body: z.object({ successorUserId: z.string() }),
		responses: { 200: z.object({ designatedAt: z.number() }) },
	},
	get: {
		method: 'GET',
		path: '/api/heirlooms/:id',
		responses: { 200: heirloomSchema },
	},
})
```
