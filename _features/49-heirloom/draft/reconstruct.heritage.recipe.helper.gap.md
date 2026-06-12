# Draft: reconstruct.heritage.recipe.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/heritage/reconstruct.heritage.recipe.helper.ts`

**Source:** `29` spec §10 — same reconstruction path as session-end recipe tree.

---

```typescript
import type { HeritageCaptureDraft } from '@brioela/shared/validator/heritage/heritage.capture.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { heritageRecipeDrafts } from '@/agents/brain/_schemas/heritage.recipe.draft.schema'
import { heritageRecipeCaptures } from '@/agents/brain/_schemas/heritage.recipe.capture.schema'
import { eq } from 'drizzle-orm'

export type ReconstructHeritageRecipeInput = {
	captureId: string
	sessionId: string
	transcript: string
	visionEventSummary: string | null
}

export async function reconstructHeritageRecipeHelper(
	db: BrainDatabase,
	env: Cloudflare.Env,
	input: ReconstructHeritageRecipeInput,
): Promise<HeritageCaptureDraft> {
	const draft = await runHeritageReconstructionLlm(env, input)

	const now = Date.now()
	await db
		.insert(heritageRecipeDrafts)
		.values({
			captureId: input.captureId,
			title: draft.title,
			ingredientsJson: JSON.stringify(draft.ingredients),
			stepsJson: JSON.stringify(draft.steps),
			confidenceJson: JSON.stringify(collectConfidenceMap(draft)),
			sourceSessionRef: input.sessionId,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: heritageRecipeDrafts.captureId,
			set: {
				title: draft.title,
				ingredientsJson: JSON.stringify(draft.ingredients),
				stepsJson: JSON.stringify(draft.steps),
				confidenceJson: JSON.stringify(collectConfidenceMap(draft)),
				updatedAt: now,
			},
		})

	await db
		.update(heritageRecipeCaptures)
		.set({ status: 'draft_ready', updatedAt: now })
		.where(eq(heritageRecipeCaptures.id, input.captureId))

	return {
		captureId: input.captureId,
		title: draft.title,
		ingredients: draft.ingredients,
		steps: draft.steps,
		sourceSessionRef: input.sessionId,
	}
}

async function runHeritageReconstructionLlm(
	_env: Cloudflare.Env,
	_input: ReconstructHeritageRecipeInput,
): Promise<HeritageCaptureDraft> {
	throw new Error('not implemented')
}

function collectConfidenceMap(draft: HeritageCaptureDraft): Record<string, string> {
	const map: Record<string, string> = {}
	for (const ing of draft.ingredients) {
		map[`ingredient:${ing.name}`] = ing.confidence
	}
	for (let i = 0; i < draft.steps.length; i++) {
		const step = draft.steps[i]
		if (step) map[`step:${i}`] = step.confidence
	}
	return map
}
```
