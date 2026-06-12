# Draft: copy.heirloom.photos.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/heirloom/copy.heirloom.photos.helper.ts`

**Rule:** Photos copied to recipient-scoped R2 at acceptance — recipients never depend on owner objects (spec **48**).

---

```typescript
import type { HeirloomTransferPayload } from '@brioela/shared/validator/heirloom/heirloom.transfer.payload.schema'

export async function copyHeirloomPhotosHelper(
	env: Cloudflare.Env,
	recipientUserId: string,
	payload: HeirloomTransferPayload,
): Promise<HeirloomTransferPayload> {
	const copiedCover = payload.coverPhotoRef
		? await copyR2Object(env, payload.coverPhotoRef, recipientUserId)
		: null

	const copiedMoments = await Promise.all(
		payload.moments.map(async (moment) => ({
			...moment,
			photoRef: await copyR2Object(env, moment.photoRef, recipientUserId),
		})),
	)

	return {
		...payload,
		coverPhotoRef: copiedCover,
		moments: copiedMoments,
	}
}

async function copyR2Object(
	env: Cloudflare.Env,
	sourceRef: string,
	recipientUserId: string,
): Promise<string> {
	const bucket = env.MEDIA_BUCKET
	const destKey = `heirloom/${recipientUserId}/${crypto.randomUUID()}`
	const object = await bucket.get(sourceRef)
	if (!object) throw new Error(`photo_not_found:${sourceRef}`)
	await bucket.put(destKey, object.body, {
		httpMetadata: object.httpMetadata,
	})
	return destKey
}
```
