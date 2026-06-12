# Draft: mesa.routes.ts (gap — file does not exist)

Target: `shared/routes/mesa.routes.ts` + `backend/src/api/mesa/`

**Gap:** No HTTP routes for invite accept and contributor submission (G1).

**Source:** `build-guide/26-mesa/07-shared-enrichment-and-invites.md`

---

```typescript
// shared/routes/mesa.routes.ts
export const MESA_ROUTES = {
	invitePending: '/api/mesa/invites/pending',
	inviteAccept: '/api/mesa/invites/:inviteId/accept',
	contributionSubmit: '/api/mesa/contributions',
	audienceActive: '/api/mesa/audience/active',
} as const
```

```typescript
// backend/src/api/mesa/_handlers/post.mesa.contribution.handler.ts
import type { Context } from 'hono'
import { routeToOwnerBrainDo } from '@/platform/brain/route.to.owner.brain.do'

export async function postMesaContributionHandler(c: Context) {
	const contributorUserId = c.get('userId')
	const body = await c.req.json<{
		ownerUserId: string
		mesaId: string
		entityKind: string
		payload: Record<string, unknown>
	}>()

	// G1: RPC into owner's Brain DO — contributor DO must NOT store authoritative Mesa rows
	await routeToOwnerBrainDo(body.ownerUserId, 'submitMesaContribution', {
		contributorUserId,
		...body,
	})

	return c.json({ submitted: true })
}
```
