# Gap snapshot: get.import.status.handler.ts

Target: `backend/src/api/recipes/_handlers/get.import.status.handler.ts`

**Status:** Not in repo. `02-import-job-workflow.md` status polling.

```typescript
import { RecipeImportStatusResponseSchema } from '@brioela/shared/validator/recipe.import'
import { supabase } from '@/core/database/supabase-admin-client'
import { apiErrorResponse } from '@/lib/response'
import { ErrorCode } from '@brioela/shared/types/api'
import type { AppContext } from '@/index'

export async function getImportStatus(c: AppContext) {
	const userId = c.get('userId')
	const jobId = c.req.param('jobId')

	const { data, error } = await supabase
		.from('shared_import_jobs')
		.select('*')
		.eq('id', jobId)
		.eq('user_id', userId)
		.maybeSingle()

	if (error || !data) {
		return c.json(apiErrorResponse(ErrorCode.NOT_FOUND, 'Import job not found'), 404)
	}

	const response = RecipeImportStatusResponseSchema.parse({
		jobId: data.id,
		status: data.status,
		route: data.route,
		recipeId: data.recipe_id,
		previewTitle: data.title_hint,
		thumbnailUrl: data.thumbnail_url,
		warnings: JSON.parse(data.warnings_json ?? '[]'),
		failureReason: data.failure_reason,
	})

	return c.json(response)
}
```
