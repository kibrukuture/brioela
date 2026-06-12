# Draft: invite.heirloom.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/heirloom/invite.heirloom.handler.ts`

---

```typescript
import { createId } from '@brioela/shared/id'
import { HEIRLOOM_INVITATION_EXPIRY_MS } from '@brioela/shared/constants/heirloom/heirloom.invitation.status.constant'
import type { BrainDatabase } from '@/agents/brain/database'
import { heirlooms } from '@/agents/brain/_schemas/heirloom.schema'
import { eq } from 'drizzle-orm'

export async function inviteHeirloomHandler(
	db: BrainDatabase,
	supabase: SupabaseClient,
	ownerUserId: string,
	heirloomId: string,
	inviteeContact: string,
	appBaseUrl: string,
): Promise<{ invitationId: string; shareUrl: string; expiresAt: number }> {
	const header = await db.select().from(heirlooms).where(eq(heirlooms.id, heirloomId)).get()
	if (!header || header.userId !== ownerUserId) throw new Error('heirloom_not_owned')

	const invitationId = createId()
	const now = Date.now()
	const expiresAt = now + HEIRLOOM_INVITATION_EXPIRY_MS
	const contactHash = await hashInviteeContact(inviteeContact)

	await supabase.from('heirloom_invitation').insert({
		invitation_id: invitationId,
		heirloom_id: heirloomId,
		owner_user_id: ownerUserId,
		invitee_contact_hash: contactHash,
		status: 'sent',
		version_at_invite: header.version,
		created_at: new Date(now).toISOString(),
	})

	const shareUrl = `${appBaseUrl}/heirloom/invite/${invitationId}`
	return { invitationId, shareUrl, expiresAt }
}

async function hashInviteeContact(contact: string): Promise<string> {
	const data = new TextEncoder().encode(contact.trim().toLowerCase())
	const digest = await crypto.subtle.digest('SHA-256', data)
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}
```
