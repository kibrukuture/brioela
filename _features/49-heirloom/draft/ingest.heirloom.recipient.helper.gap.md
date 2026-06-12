# Draft: ingest.heirloom.recipient.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/heirloom/ingest.heirloom.recipient.helper.ts`

**Rule:** Independent copy — recipient owns their Brain rows; no sync with owner (`03-do-to-do-delivery.md`).

---

```typescript
import { createId } from '@brioela/shared/id'
import type { HeirloomTransferPayload } from '@brioela/shared/validator/heirloom/heirloom.transfer.payload.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { heirlooms } from '@/agents/brain/_schemas/heirloom.schema'
import { heirloomItems } from '@/agents/brain/_schemas/heirloom.item.schema'
import { writeUserRecipe } from '@/agents/brain/_repositories/write.user.recipe.repository'
import { cookStyleProfiles } from '@/agents/brain/_schemas/cook.style.profile.schema'

export async function ingestHeirloomRecipientHelper(
	db: BrainDatabase,
	recipientUserId: string,
	payload: HeirloomTransferPayload,
	receivedFromUserId: string,
): Promise<{ heirloomId: string }> {
	const heirloomId = createId()
	const now = Date.now()

	await db.insert(heirlooms).values({
		id: heirloomId,
		userId: recipientUserId,
		role: 'recipient',
		cookName: payload.cookName,
		cookRelationship: payload.cookRelationship,
		dedicationText: payload.dedicationText,
		coverPhotoRef: payload.coverPhotoRef,
		version: payload.version,
		receivedFrom: receivedFromUserId,
		createdAt: now,
		updatedAt: now,
	})

	const refMap = new Map<string, string>()

	for (const recipe of payload.recipes) {
		const newRecipeId = createId()
		refMap.set(recipe.sourceRecipeId, newRecipeId)
		await writeUserRecipe(db, {
			id: newRecipeId,
			userId: recipientUserId,
			origin: 'family_capture',
			content: recipe.content,
			createdAt: now,
			updatedAt: now,
		})
		await db.insert(heirloomItems).values({
			id: createId(),
			heirloomId,
			itemType: 'recipe',
			localRef: newRecipeId,
			ownerNote: recipe.ownerNote ?? null,
			addedAt: now,
			versionAdded: payload.version,
		})
	}

	if (payload.styleProfile) {
		const newProfileId = createId()
		refMap.set(payload.styleProfile.sourceProfileId, newProfileId)
		await db.insert(cookStyleProfiles).values({
			id: newProfileId,
			userId: recipientUserId,
			cookName: payload.styleProfile.cookName,
			cookRelationship: payload.styleProfile.cookRelationship,
			sessionIdsJson: '[]',
			styleSummaryText: payload.styleProfile.styleSummaryText,
			extractedAt: now,
			createdAt: now,
			updatedAt: now,
		})
		await db.insert(heirloomItems).values({
			id: createId(),
			heirloomId,
			itemType: 'style_profile',
			localRef: newProfileId,
			ownerNote: null,
			addedAt: now,
			versionAdded: payload.version,
		})
	}

	for (const moment of payload.moments) {
		await db.insert(heirloomItems).values({
			id: createId(),
			heirloomId,
			itemType: 'moment',
			localRef: moment.photoRef,
			ownerNote: moment.note ?? null,
			addedAt: now,
			versionAdded: payload.version,
		})
	}

	return { heirloomId }
}
```
