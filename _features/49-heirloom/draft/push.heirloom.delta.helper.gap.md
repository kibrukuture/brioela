# Draft: push.heirloom.delta.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/heirloom/push.heirloom.delta.helper.ts`

**Rule:** Append-only; prior recipients offered delta with accept prompt — nothing lands silently.

---

```typescript
import { createId } from '@brioela/shared/id'
import type { BrainDatabase } from '@/agents/brain/database'
import { heirlooms } from '@/agents/brain/_schemas/heirloom.schema'
import { heirloomItems } from '@/agents/brain/_schemas/heirloom.item.schema'
import { eq } from 'drizzle-orm'

export type PushHeirloomItemInput = {
	heirloomId: string
	itemType: 'recipe' | 'style_profile' | 'moment'
	localRef: string
	ownerNote?: string
}

export async function pushHeirloomDeltaHelper(
	db: BrainDatabase,
	userId: string,
	input: PushHeirloomItemInput,
): Promise<{ version: number; newItemId: string }> {
	const header = await db.select().from(heirlooms).where(eq(heirlooms.id, input.heirloomId)).get()
	if (!header || header.userId !== userId || header.role !== 'owner') {
		throw new Error('heirloom_not_owned')
	}

	const nextVersion = header.version + 1
	const now = Date.now()
	const newItemId = createId()

	await db.insert(heirloomItems).values({
		id: newItemId,
		heirloomId: input.heirloomId,
		itemType: input.itemType,
		localRef: input.localRef,
		ownerNote: input.ownerNote ?? null,
		addedAt: now,
		versionAdded: nextVersion,
	})

	await db
		.update(heirlooms)
		.set({ version: nextVersion, updatedAt: now })
		.where(eq(heirlooms.id, input.heirloomId))

	return { version: nextVersion, newItemId }
}
```
