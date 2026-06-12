# Draft: encore.reconstruction.workflow.ts (gap — file does not exist)

Target: `backend/src/api/encores/jobs/encore.reconstruction.workflow.ts`

**Source:** `build-guide/31-encore/02-reconstruction-workflow.md`

```typescript
import { serve } from '@upstash/workflow/cloudflare'
import { analyzePlateVision } from '@/agents/brain/_helpers/encore/analyze.plate.vision.helper'
import { fuseEncoreContext } from '@/agents/brain/_helpers/encore/fuse.encore.context.helper'
import { reconstructEncoreRecipe } from '@/agents/brain/_helpers/encore/reconstruct.encore.recipe.helper'
import { adaptEncoreConstraints } from '@/agents/brain/_helpers/encore/adapt.encore.constraints.helper'
import { checkEncoreSourcing } from '@/agents/brain/_helpers/encore/check.encore.sourcing.helper'
import { writeEncoreRecipe } from '@/agents/brain/_helpers/encore/write.encore.recipe.helper'
import type { EncoreCaptureInput } from '@brioela/shared/validator/encore/encore.schema'

type WorkflowPayload = {
	encoreId: string
	userId: string
	capture: EncoreCaptureInput
	imageUrls: string[]
}

export const encoreReconstructionWorkflow = serve<WorkflowPayload>(async (context) => {
	const { encoreId, userId, capture, imageUrls } = context.requestPayload
	const env = context.env as Cloudflare.Env

	const vision = await context.run('visual-analysis', async () => {
		return analyzePlateVision({ imageUrls })
	})

	const fused = await context.run('context-fusion', async () => {
		return fuseEncoreContext(env, userId, vision, capture)
	})

	const reconstructed = await context.run('recipe-reconstruction', async () => {
		return reconstructEncoreRecipe(fused)
	})

	const adapted = await context.run('constraint-adaptation', async () => {
		return adaptEncoreConstraints(env, userId, reconstructed)
	})

	const sourcing = await context.run('sourcing-check', async () => {
		try {
			return await checkEncoreSourcing(env, userId, adapted.recipe)
		} catch {
			return []
		}
	})

	await context.run('persist-draft', async () => {
		const brain = await getBrainDatabase(env, userId)
		await writeEncoreRecipe(brain, {
			userId,
			encoreId,
			adapted,
			sourcing,
			originCity: capture.context.city,
			originPlaceId: capture.context.placeId,
			capturedAt: capture.context.capturedAt,
		})
		await notifyEncoreDraftReady(env, userId, encoreId)
	})

	return { encoreId, status: 'draft' as const }
})

async function getBrainDatabase(_env: Cloudflare.Env, _userId: string) {
	throw new Error('Brain DO stub')
}

async function notifyEncoreDraftReady(
	_env: Cloudflare.Env,
	_userId: string,
	_encoreId: string,
): Promise<void> {
	// TODO(21): high-priority in-app; push only if backgrounded
}
```
