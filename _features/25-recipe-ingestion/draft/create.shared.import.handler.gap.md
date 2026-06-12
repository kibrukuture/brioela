# Gap snapshot: create.shared.import.handler.ts

Target: `backend/src/api/recipes/_handlers/create.shared.import.handler.ts`

**Status:** Not in repo. Entry point from share extension — `01-share-sheet-entry.md`.

```typescript
import { RecipeShareInputSchema, CreateSharedImportResponseSchema } from '@brioela/shared/validator/recipe.import'
import { supabase } from '@/core/database/supabase-admin-client'
import { createId } from '@brioela/shared/id'
import { apiErrorResponse } from '@/lib/response'
import { ErrorCode } from '@brioela/shared/types/api'
import { buildImportDedupeKey } from '../_helpers/dedupe.import.job.helper'
import { triggerRecipeImportWorkflow } from '../jobs/recipe.import.job.orchestrator'
import type { AppContext } from '@/index'

export async function createSharedImport(c: AppContext) {
	const userId = c.get('userId')
	if (!userId) {
		return c.json(apiErrorResponse(ErrorCode.UNAUTHORIZED, 'Authentication required'), 401)
	}

	const body = await c.req.json()
	const input = RecipeShareInputSchema.parse(body)
	const now = Date.now()
	const dedupeKey = buildImportDedupeKey(userId, input)

	const existing = await supabase
		.from('shared_import_jobs')
		.select('id, status')
		.eq('user_id', userId)
		.eq('dedupe_key', dedupeKey)
		.in('status', ['queued', 'classifying', 'extracting', 'normalizing', 'routing', 'needs_review', 'completed'])
		.maybeSingle()

	if (existing.data?.id) {
		const response = CreateSharedImportResponseSchema.parse({
			jobId: existing.data.id,
			status: 'queued',
			estimatedSeconds: null,
		})
		return c.json(response)
	}

	const jobId = createId()
	await supabase.from('shared_import_jobs').insert({
		id: jobId,
		user_id: userId,
		source_type: input.sourceType,
		source_url: input.sourceUrl,
		source_app: input.sourceApp,
		title_hint: input.titleHint,
		preview_text: input.previewText,
		thumbnail_url: input.thumbnailUrl,
		dedupe_key: dedupeKey,
		route: 'unknown',
		status: 'queued',
		warnings_json: '[]',
		started_at: now,
		created_at: now,
		updated_at: now,
	})

	await triggerRecipeImportWorkflow(c.env, { jobId, userId, input })

	const response = CreateSharedImportResponseSchema.parse({
		jobId,
		status: 'queued',
		estimatedSeconds: 45,
	})
	return c.json(response)
}
```
