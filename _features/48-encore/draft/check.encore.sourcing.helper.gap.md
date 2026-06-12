# Draft: check.encore.sourcing.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/encore/check.encore.sourcing.helper.ts`

**Gap (feature 48):** Workflow step 5 — per-ingredient sourcing statuses.

```typescript
import { ENCORE_SOURCING_STATUS, type EncoreSourcingStatus } from '@brioela/shared/constants/encore/encore.sourcing.status.constant'
import type { NormalizedRecipeContent } from '@brioela/shared/validator/recipe/normalized.recipe.content.schema'

export type EncoreSourcingItem = {
	ingredientName: string
	status: EncoreSourcingStatus
	nearestPlaceId?: string
	nearestFindId?: string
}

export async function checkEncoreSourcing(
	env: Cloudflare.Env,
	userId: string,
	recipe: NormalizedRecipeContent,
): Promise<EncoreSourcingItem[]> {
	const items: EncoreSourcingItem[] = []

	for (const ingredient of recipe.ingredients) {
		const pantryHit = await checkPantryInference(env, userId, ingredient.name)
		if (pantryHit) {
			items.push({ ingredientName: ingredient.name, status: ENCORE_SOURCING_STATUS.HAVE })
			continue
		}

		const nearby = await checkGroundOrMapNearby(env, userId, ingredient.name)
		if (nearby) {
			items.push({
				ingredientName: ingredient.name,
				status: ENCORE_SOURCING_STATUS.NEARBY,
				nearestPlaceId: nearby.placeId,
				nearestFindId: nearby.findId,
			})
			continue
		}

		items.push({
			ingredientName: ingredient.name,
			status: ENCORE_SOURCING_STATUS.HARD_TO_FIND,
		})

		await logIngredientNotFound(env, userId, ingredient.name)
	}

	return items
}

async function checkPantryInference(
	_env: Cloudflare.Env,
	_userId: string,
	_name: string,
): Promise<boolean> {
	return false
}

async function checkGroundOrMapNearby(
	_env: Cloudflare.Env,
	_userId: string,
	_name: string,
): Promise<{ placeId?: string; findId?: string } | null> {
	return null
}

async function logIngredientNotFound(
	_env: Cloudflare.Env,
	_userId: string,
	_ingredientName: string,
): Promise<void> {
	// TODO(05): memory_event kind ingredient_not_found — enum extension required
}
```
