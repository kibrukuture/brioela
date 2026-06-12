# Draft: heirloom.delivery.workflow.ts (gap — file does not exist)

Target: `backend/src/api/heirlooms/jobs/heirloom.delivery.workflow.ts`

**Source:** `build-guide/35-heirloom/03-do-to-do-delivery.md` — idempotent; no partial surface state.

---

```typescript
import { serve } from '@upstash/workflow/cloudflare'
import { buildHeirloomPayloadHelper } from '@/agents/brain/_helpers/heirloom/build.heirloom.payload.helper'
import { copyHeirloomPhotosHelper } from '@/agents/brain/_helpers/heirloom/copy.heirloom.photos.helper'
import { ingestHeirloomRecipientHelper } from '@/agents/brain/_helpers/heirloom/ingest.heirloom.recipient.helper'

type HeirloomDeliveryPayload = {
	invitationId: string
	heirloomId: string
	ownerUserId: string
	recipientUserId: string
	versionAtInvite: number
}

export const heirloomDeliveryWorkflow = serve<HeirloomDeliveryPayload>(async (context) => {
	const payload = context.requestPayload

	await context.run('validate-invitation', async () => {
		await validateInvitationAcceptedOnce(payload.invitationId)
	})

	const transferPayload = await context.run('assemble-owner-payload', async () => {
		const ownerDb = await openBrainDb(payload.ownerUserId)
		return buildHeirloomPayloadHelper(ownerDb, payload.heirloomId, payload.versionAtInvite)
	})

	const withPhotos = await context.run('copy-photos-to-recipient-r2', async () => {
		return copyHeirloomPhotosHelper(context.env, payload.recipientUserId, transferPayload)
	})

	await context.run('ingest-recipient-brain', async () => {
		const recipientDb = await openBrainDb(payload.recipientUserId)
		await ingestHeirloomRecipientHelper(
			recipientDb,
			payload.recipientUserId,
			withPhotos,
			payload.ownerUserId,
		)
	})

	await context.run('mark-invitation-accepted', async () => {
		await markInvitationAccepted(payload.invitationId)
		await notifyOwnerDeliveryComplete(payload.ownerUserId, payload.heirloomId)
	})
})

async function validateInvitationAcceptedOnce(_invitationId: string): Promise<void> {}
async function openBrainDb(_userId: string): Promise<never> {
	throw new Error('not implemented')
}
async function markInvitationAccepted(_invitationId: string): Promise<void> {}
async function notifyOwnerDeliveryComplete(_ownerUserId: string, _heirloomId: string): Promise<void> {}
```
