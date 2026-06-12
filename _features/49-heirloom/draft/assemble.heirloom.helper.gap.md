# Draft: assemble.heirloom.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/heirloom/assemble.heirloom.helper.ts`

**Rule:** Nothing included by default — explicit curation only (`01-heirloom-assembly.md`).

---

```typescript
import { createId } from '@brioela/shared/id'
import type { HeirloomAssembleInput } from '@brioela/shared/validator/heirloom/heirloom.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { heirlooms } from '@/agents/brain/_schemas/heirloom.schema'
import { heirloomItems } from '@/agents/brain/_schemas/heirloom.item.schema'

export async function assembleHeirloomHelper(
	db: BrainDatabase,
	userId: string,
	input: HeirloomAssembleInput,
): Promise<{ heirloomId: string; version: number }> {
	assertOwnedHeritageContent(db, userId, input)

	const heirloomId = createId()
	const now = Date.now()
	const version = 1

	await db.insert(heirlooms).values({
		id: heirloomId,
		userId,
		role: 'owner',
		cookName: input.cookName,
		cookRelationship: input.cookRelationship ?? null,
		dedicationText: input.dedicationText ?? null,
		coverPhotoRef: input.coverPhotoRef ?? null,
		version,
		receivedFrom: null,
		createdAt: now,
		updatedAt: now,
	})

	const items: Array<{ type: 'recipe' | 'style_profile' | 'moment'; ref: string; note?: string }> =
		[
			...input.recipeIds.map((id) => ({ type: 'recipe' as const, ref: id })),
			...(input.styleProfileId
				? [{ type: 'style_profile' as const, ref: input.styleProfileId }]
				: []),
			...input.momentRefs.map((m) => ({
				type: 'moment' as const,
				ref: m.photoRef,
				note: m.note,
			})),
		]

	if (items.length === 0) {
		throw new Error('heirloom_empty_not_allowed')
	}

	for (const item of items) {
		await db.insert(heirloomItems).values({
			id: createId(),
			heirloomId,
			itemType: item.type,
			localRef: item.ref,
			ownerNote: item.note ?? null,
			addedAt: now,
			versionAdded: version,
		})
	}

	return { heirloomId, version }
}

function assertOwnedHeritageContent(
	_db: BrainDatabase,
	_userId: string,
	_input: HeirloomAssembleInput,
): void {
	// Verify recipeIds are family_capture origin, styleProfileId belongs to user, moments attached
}
```
