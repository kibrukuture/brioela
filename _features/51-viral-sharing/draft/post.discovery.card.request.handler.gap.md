# Draft: post.discovery.card.request.handler.ts (gap — file does not exist)

Target: `backend/src/api/viral.sharing/_handlers/post.discovery.card.request.handler.ts`

**Gap (feature 51):** HTTP wrapper for preview.

---

```typescript
import type { Context } from 'hono'
import { requestDiscoveryCardHandler } from '@/agents/brain/_handlers/viral.sharing/request.discovery.card.handler'
import { apiErrorResponse, apiSuccessResponse } from '@brioela/shared/validator/api'

export async function postDiscoveryCardRequestHandler(c: Context) {
	const body: unknown = await c.req.json()
	const result = await requestDiscoveryCardHandler(body)

	if (!result.ok) {
		return c.json(apiErrorResponse('DISCOVERY_CARD_BLOCKED', result.reason), 403)
	}

	return c.json(
		apiSuccessResponse({
			card: result.card,
			requiresExplicitConsent: result.requiresExplicitConsent,
		}),
	)
}
```
