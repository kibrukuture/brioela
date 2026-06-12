# Draft: build.heirloom.payload.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/heirloom/build.heirloom.payload.helper.ts`

---

```typescript
import type { HeirloomTransferPayload } from '@brioela/shared/validator/heirloom/heirloom.transfer.payload.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { heirlooms } from '@/agents/brain/_schemas/heirloom.schema'
import { heirloomItems } from '@/agents/brain/_schemas/heirloom.item.schema'
import { eq, lte } from 'drizzle-orm'

export async function buildHeirloomPayloadHelper(
	db: BrainDatabase,
	heirloomId: string,
	atVersion: number,
): Promise<HeirloomTransferPayload> {
	const header = await db.select().from(heirlooms).where(eq(heirlooms.id, heirloomId)).get()
	if (!header) throw new Error('heirloom_not_found')

	const items = await db
		.select()
		.from(heirloomItems)
		.where(eq(heirloomItems.heirloomId, heirloomId))
		.all()

	const versionedItems = items.filter((i) => i.versionAdded <= atVersion)

	const recipes = await resolveRecipePayloads(db, versionedItems)
	const styleProfile = await resolveStyleProfilePayload(db, versionedItems)
	const moments = await resolveMomentPayloads(db, versionedItems)

	return {
		heirloomId,
		version: atVersion,
		cookName: header.cookName,
		cookRelationship: header.cookRelationship,
		dedicationText: header.dedicationText,
		coverPhotoRef: header.coverPhotoRef,
		recipes,
		styleProfile,
		moments,
	}
}

async function resolveRecipePayloads(
	_db: BrainDatabase,
	_items: (typeof heirloomItems.$inferSelect)[],
): Promise<HeirloomTransferPayload['recipes']> {
	return []
}

async function resolveStyleProfilePayload(
	_db: BrainDatabase,
	_items: (typeof heirloomItems.$inferSelect)[],
): Promise<HeirloomTransferPayload['styleProfile']> {
	return null
}

async function resolveMomentPayloads(
	_db: BrainDatabase,
	_items: (typeof heirloomItems.$inferSelect)[],
): Promise<HeirloomTransferPayload['moments']> {
	return []
}
```
