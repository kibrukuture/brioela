# Draft: accept.heirloom.invitation.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/heirloom/accept.heirloom.invitation.handler.ts`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/database'

export async function acceptHeirloomInvitationHandler(
	env: Cloudflare.Env,
	ownerDb: BrainDatabase,
	recipientDb: BrainDatabase,
	invitation: {
		invitationId: string
		heirloomId: string
		ownerUserId: string
		recipientUserId: string
		versionAtInvite: number
	},
): Promise<{ heirloomId: string; status: 'delivered' }> {
	await enqueueHeirloomDeliveryWorkflow(env, invitation)
	return { heirloomId: invitation.heirloomId, status: 'delivered' }
}

async function enqueueHeirloomDeliveryWorkflow(
	_env: Cloudflare.Env,
	_invitation: unknown,
): Promise<void> {}
```
