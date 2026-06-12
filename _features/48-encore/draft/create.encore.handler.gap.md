# Draft: create.encore.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/encore/create.encore.handler.ts`

```typescript
import { createId } from '@brioela/shared/id'
import type { EncoreCaptureInput } from '@brioela/shared/validator/encore/encore.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { encores } from '@/agents/brain/_schemas/encore.schema'

export async function createEncoreHandler(
	db: BrainDatabase,
	env: Cloudflare.Env,
	userId: string,
	input: EncoreCaptureInput,
): Promise<{ encoreId: string; status: 'reconstructing' }> {
	const encoreId = createId()
	const now = Date.now()

	await db.insert(encores).values({
		id: encoreId,
		userId,
		capturedAt: input.context.capturedAt,
		originCity: input.context.city,
		originPlaceId: input.context.placeId,
		status: 'reconstructing',
		photoRefsDiscarded: false,
		createdAt: now,
		updatedAt: now,
	})

	const imageUrls = await resolveEphemeralUploadUrls(env, input.photoUploadIds)

	await enqueueEncoreReconstructionWorkflow(env, {
		encoreId,
		userId,
		capture: input,
		imageUrls,
	})

	// Side effect: meal-log memory write per spec 34 — separate helper
	await writeMealLogMemoryFromEncoreCapture(env, userId, input)

	return { encoreId, status: 'reconstructing' }
}

async function resolveEphemeralUploadUrls(
	_env: Cloudflare.Env,
	_uploadIds: string[],
): Promise<string[]> {
	return []
}

async function enqueueEncoreReconstructionWorkflow(
	_env: Cloudflare.Env,
	_payload: unknown,
): Promise<void> {}

async function writeMealLogMemoryFromEncoreCapture(
	_env: Cloudflare.Env,
	_userId: string,
	_input: EncoreCaptureInput,
): Promise<void> {}
```
