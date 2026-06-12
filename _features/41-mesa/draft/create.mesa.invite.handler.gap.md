# Draft: create.mesa.invite.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/mesa/create.mesa.invite.handler.ts`

**Gap:** No invite creation; cross-brain notify (G1) unwired.

**Source:** `build-guide/26-mesa/07-shared-enrichment-and-invites.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { mesaInvite } from '@/agents/brain/_schemas/mesa.invite.schema'
import type { MesaInviteRole } from '@shared/validator/mesa/mesa.invite.schema'
import { randomUUID } from 'node:crypto'

export type CreateMesaInviteInput = {
	mesaId: string
	inviterUserId: string
	inviteeUserId: string | null
	inviteeContactHash: string | null
	role: MesaInviteRole
	scopes: string[]
}

export async function createMesaInvite(
	db: BrainDatabase,
	input: CreateMesaInviteInput,
): Promise<{ inviteId: string }> {
	const inviteId = randomUUID()
	const now = Date.now()

	await db.insert(mesaInvite).values({
		id: inviteId,
		mesaId: input.mesaId,
		inviterUserId: input.inviterUserId,
		inviteeUserId: input.inviteeUserId,
		inviteeContactHash: input.inviteeContactHash,
		role: input.role,
		scopesJson: JSON.stringify(input.scopes),
		status: 'pending',
		createdAt: now,
	})

	// TODO(G1): platform notification to invitee — **21** + cross-user routing

	return { inviteId }
}
```
