# Draft: heirloom.broker.route.ts (gap — file does not exist)

Target: `backend/src/api/heirloom-broker/heirloom.broker.route.ts`

**Rule:** Broker holds payload transiently only — nothing persisted outside the two DOs (spec **48**).

---

```typescript
import { Hono } from 'hono'
import { HEIRLOOM_ROUTES } from '@brioela/shared/routes/heirloom.routes'
import type { HeirloomTransferPayload } from '@brioela/shared/validator/heirloom/heirloom.transfer.payload.schema'

const heirloomBroker = new Hono<{ Bindings: Cloudflare.Env }>()

heirloomBroker.post(HEIRLOOM_ROUTES.broker, async (c) => {
	const body = await c.req.json<{
		ownerUserId: string
		recipientUserId: string
		payload: HeirloomTransferPayload
		invitationId: string
	}>()

	// Transient in-memory / short-lived — never write payload to Supabase or R2 metadata store
	const ownerStub = await getBrainStub(c.env, body.ownerUserId)
	const recipientStub = await getBrainStub(c.env, body.recipientUserId)

	const verified = await ownerStub.verifyHeirloomTransferAuthorization(body.invitationId)
	if (!verified) return c.json({ error: 'unauthorized' }, 403)

	await recipientStub.ingestHeirloomTransfer(body.payload, body.ownerUserId)

	return c.json({ status: 'delivered' })
})

async function getBrainStub(_env: Cloudflare.Env, _userId: string): Promise<BrainStub> {
	throw new Error('not implemented')
}

type BrainStub = {
	verifyHeirloomTransferAuthorization(invitationId: string): Promise<boolean>
	ingestHeirloomTransfer(payload: HeirloomTransferPayload, fromUserId: string): Promise<void>
}

export { heirloomBroker }
```
