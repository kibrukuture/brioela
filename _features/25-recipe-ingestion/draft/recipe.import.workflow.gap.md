# Gap snapshot: recipe.import.workflow.ts

Target: `backend/src/api/recipes/jobs/recipe.import.workflow.ts`

**Status:** Not in repo. Upstash Workflow — `02-import-job-workflow.md` 10 steps.

```typescript
import { serve } from '@upstash/workflow/cloudflare'
import { supabase } from '@/core/database/supabase-admin-client'
import { classifySharedContent } from '../_helpers/classify.shared.content.helper'
import { routeSharedContent } from '../_helpers/route.shared.content.helper'
import { extractSourceArtifacts } from '../_helpers/extract.source.artifacts.helper'
import { deepWebSearchRecipeEvidence } from '../_helpers/deep.web.search.recipe.helper'
import { normalizeRecipeFromArtifacts } from '../_helpers/normalize.recipe.helper'
import { checkImportConstraints } from '../_helpers/check.import.constraints.helper'
import { writeImportedRecipeToBrain } from '../_helpers/write.imported.recipe.helper'
import { logRecipeImportedEvent } from '../_helpers/log.recipe.imported.helper'
import type { RecipeShareInput } from '@brioela/shared/validator/recipe.import'

type WorkflowPayload = {
	jobId: string
	userId: string
	input: RecipeShareInput
}

async function updateJob(
	jobId: string,
	patch: Record<string, unknown>,
): Promise<void> {
	await supabase
		.from('shared_import_jobs')
		.update({ ...patch, updated_at: Date.now() })
		.eq('id', jobId)
}

export const recipeImportWorkflow = serve<WorkflowPayload>(async (context) => {
	const { jobId, userId, input } = context.requestPayload
	const env = context.env as Cloudflare.Env

	await context.run('classify', async () => {
		await updateJob(jobId, { status: 'classifying' })
		const classification = classifySharedContent({
			jobId,
			shareInput: input,
			pageTextPreview: input.previewText,
		})

		if (classification.recommendedRoute !== 'recipe_import') {
			await updateJob(jobId, { status: 'routing', route: classification.recommendedRoute })
			await routeSharedContent(env, userId, jobId, classification, input)
			await updateJob(jobId, { status: 'completed', completed_at: Date.now() })
			return { routed: true }
		}

		return classification
	})

	const artifacts = await context.run('extract', async () => {
		await updateJob(jobId, { status: 'extracting' })
		return extractSourceArtifacts(env, jobId, input)
	})

	const deepSearch = await context.run('deep-search', async () => {
		return deepWebSearchRecipeEvidence(artifacts, env)
	})

	const normalized = await context.run('normalize', async () => {
		await updateJob(jobId, { status: 'normalizing' })
		return normalizeRecipeFromArtifacts({ shareInput: input, artifacts, deepSearch })
	})

	const constraints = await context.run('constraints', async () => {
		return checkImportConstraints(env, userId, normalized)
	})

	const result = await context.run('store', async () => {
		if (normalized.confidence < 0.4 || normalized.steps.length < 2 || normalized.ingredients.length < 2) {
			await updateJob(jobId, {
				status: 'partial',
				warnings_json: JSON.stringify(normalized.warnings),
				completed_at: Date.now(),
			})
			return { partial: true }
		}

		const { recipeId } = await writeImportedRecipeToBrain(env, userId, normalized, input)
		const finalStatus = normalized.confidence < 0.65 ? 'needs_review' : 'completed'

		await updateJob(jobId, {
			status: finalStatus,
			route: 'recipe',
			recipe_id: recipeId,
			confidence: normalized.confidence,
			warnings_json: JSON.stringify([...normalized.warnings, ...constraints.warnings]),
			completed_at: Date.now(),
		})

		await logRecipeImportedEvent(env, userId, {
			recipeId,
			sourceType: input.sourceType,
			sharedFrom: input.sourceApp,
			title: normalized.title,
			confidence: normalized.confidence,
			status: finalStatus,
		})

		return { recipeId, finalStatus }
	})

	return result
})
```
