# Draft: get.encore.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/encore/get.encore.handler.ts`

```typescript
import { eq } from 'drizzle-orm'
import type { BrainDatabase } from '@/agents/brain/database'
import { encores } from '@/agents/brain/_schemas/encore.schema'
import { encoreOpenQuestions } from '@/agents/brain/_schemas/encore.open.question.schema'
import { recipes } from '@/agents/brain/_schemas/recipe.schema'
import { normalizedRecipeContentSchema } from '@brioela/shared/validator/recipe/normalized.recipe.content.schema'
import type { EncoreResponse } from '@brioela/shared/validator/encore/encore.schema'
import { checkTierAccess } from '@/helpers/tier/check.tier.access.helper'

export async function getEncoreHandler(
	db: BrainDatabase,
	userId: string,
	encoreId: string,
): Promise<EncoreResponse | null> {
	const row = await db.query.encores.findFirst({
		where: eq(encores.id, encoreId),
	})

	if (!row || row.userId !== userId) return null

	const openQuestions = await db.query.encoreOpenQuestions.findMany({
		where: eq(encoreOpenQuestions.encoreId, encoreId),
	})

	let draftRecipe: EncoreResponse['draftRecipe']
	let sourcing: EncoreResponse['sourcing']

	if (row.recipeId) {
		const recipeRow = await db.query.recipes.findFirst({
			where: eq(recipes.id, row.recipeId),
		})

		if (recipeRow) {
			const parsed = normalizedRecipeContentSchema.parse(JSON.parse(recipeRow.content))
			const tier = await checkTierAccess(userId, 'encore_recreation')

			if (tier.allowed) {
				draftRecipe = parsed
				sourcing = extractSourcingFromContent(parsed)
			} else {
				draftRecipe = buildEncorePreview(parsed)
			}
		}
	}

	return {
		encoreId: row.id,
		status: row.status,
		recipeId: row.recipeId ?? undefined,
		draftRecipe,
		sourcing,
		openQuestions: openQuestions.map((q) => ({
			id: q.id,
			component: q.component,
			questionText: q.questionText,
			resolved: q.resolved,
		})),
		originCity: row.originCity ?? undefined,
		originPlaceId: row.originPlaceId ?? undefined,
	}
}

function buildEncorePreview(
	recipe: ReturnType<typeof normalizedRecipeContentSchema.parse>,
) {
	return {
		...recipe,
		ingredients: recipe.ingredients.slice(0, 3),
		steps: [],
	}
}

function extractSourcingFromContent(
	recipe: ReturnType<typeof normalizedRecipeContentSchema.parse>,
): EncoreResponse['sourcing'] {
	const meta = (recipe as { encoreMeta?: { sourcing?: EncoreResponse['sourcing'] } }).encoreMeta
	return meta?.sourcing
}
```
