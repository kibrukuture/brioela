# Gap snapshot: route.shared.content.helper.ts

Target: `backend/src/api/recipes/_helpers/route.shared.content.helper.ts`

**Status:** Not in repo. Non-recipe routes — `08-shared-content-classifier.md`. Downstream features own parsers.

```typescript
import type {
	RecipeShareInput,
	SharedContentClassification,
} from '@brioela/shared/validator/recipe.import'

type RouteEnv = Cloudflare.Env

export async function routeSharedContent(
	env: RouteEnv,
	userId: string,
	jobId: string,
	classification: SharedContentClassification,
	input: RecipeShareInput,
): Promise<void> {
	switch (classification.recommendedRoute) {
		case 'menu_scan':
			// Delegate to 26-menu-scanning when built — stub enqueue
			await enqueueMenuScanJob(env, userId, jobId, input)
			break
		case 'map_place':
			await logSharedContentRouted(env, userId, classification, 'place')
			break
		case 'product_scan':
			await enqueueProductScanContext(env, userId, jobId, input)
			break
		case 'receipt_import':
			await enqueueReceiptImport(env, userId, jobId, input)
			break
		case 'memory_event':
			await logSharedContentRouted(env, userId, classification, 'note')
			break
		case 'reject':
			// No storage — job marked failed/completed in workflow caller
			break
		case 'needs_user_choice':
			// Mobile polls job; user picks route in import tray
			break
		default:
			break
	}
}

async function logSharedContentRouted(
	env: RouteEnv,
	userId: string,
	classification: SharedContentClassification,
	entityKind: string,
): Promise<void> {
	const brainId = env.BRAIN.idFromName(userId)
	const brain = env.BRAIN.get(brainId)
	await brain.fetch(
		new Request('https://internal/log-memory-event', {
			method: 'POST',
			body: JSON.stringify({
				kind: 'shared_content_routed',
				payload: {
					primaryKind: classification.primaryKind,
					route: classification.recommendedRoute,
					confidence: classification.confidence,
					entityKind,
				},
			}),
		}),
	)
}

async function enqueueMenuScanJob(
	env: RouteEnv,
	userId: string,
	jobId: string,
	input: RecipeShareInput,
): Promise<void> {
	// 26-menu-scanning consumer — no-op until feature ships
	void env
	void userId
	void jobId
	void input
}

async function enqueueProductScanContext(
	env: RouteEnv,
	userId: string,
	jobId: string,
	input: RecipeShareInput,
): Promise<void> {
	void env
	void userId
	void jobId
	void input
}

async function enqueueReceiptImport(
	env: RouteEnv,
	userId: string,
	jobId: string,
	input: RecipeShareInput,
): Promise<void> {
	void env
	void userId
	void jobId
	void input
}
```
