# Draft: viral.sharing.contract.ts (gap — file does not exist)

Target: `shared/contracts/viral.sharing.contract.ts`

**Gap (feature 51):** ts-rest contract for mobile API.

---

```typescript
import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { discoveryCardSchema } from '@brioela/shared/validator/viral.sharing/discovery.card.schema'
import { requestDiscoveryCardSchema } from '@brioela/shared/validator/viral.sharing/request.discovery.card.schema'
import { confirmDiscoveryCardShareSchema } from '@brioela/shared/validator/viral.sharing/confirm.discovery.card.share.schema'

const c = initContract()

export const viralSharingContract = c.router({
	requestDiscoveryCard: {
		method: 'POST',
		path: '/viral-sharing/discovery-cards/request',
		body: requestDiscoveryCardSchema,
		responses: {
			200: z.object({
				card: discoveryCardSchema,
				requiresExplicitConsent: z.boolean(),
			}),
			403: z.object({ reason: z.literal('blocked') }),
		},
	},
	confirmDiscoveryCardShare: {
		method: 'POST',
		path: '/viral-sharing/discovery-cards/confirm',
		body: confirmDiscoveryCardShareSchema,
		responses: {
			200: z.object({
				artifactRef: z.string(),
				mimeType: z.literal('image/png'),
			}),
			403: z.object({ reason: z.enum(['consent_required', 'card_not_found']) }),
		},
	},
})
```
