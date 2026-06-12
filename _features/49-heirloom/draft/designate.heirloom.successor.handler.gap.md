# Draft: designate.heirloom.successor.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/heirloom/designate.heirloom.successor.handler.ts`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/database'
import { heirlooms } from '@/agents/brain/_schemas/heirloom.schema'
import { eq } from 'drizzle-orm'

export async function designateHeirloomSuccessorHandler(
	db: BrainDatabase,
	supabase: SupabaseClient,
	ownerUserId: string,
	heirloomId: string,
	successorUserId: string,
): Promise<{ designatedAt: number }> {
	const header = await db.select().from(heirlooms).where(eq(heirlooms.id, heirloomId)).get()
	if (!header || header.userId !== ownerUserId || header.role !== 'owner') {
		throw new Error('heirloom_not_owned')
	}

	const now = Date.now()

	await supabase.from('heirloom_succession').upsert({
		heirloom_id: heirloomId,
		owner_user_id: ownerUserId,
		successor_user_id: successorUserId,
		designated_at: new Date(now).toISOString(),
		executed_at: null,
	})

	return { designatedAt: now }
}
```
