# Draft: write.encore.recipe.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/encore/write.encore.recipe.helper.ts`

**Gap (feature 48):** Transactional insert of `recipes` + `encore` + open questions. No `create_user_recipe` tool (**08**).

```typescript
import { createId } from '@brioela/shared/id'
import type { BrainDatabase } from '@/agents/brain/database'
import { encores } from '@/agents/brain/_schemas/encore.schema'
import { encoreOpenQuestions } from '@/agents/brain/_schemas/encore.open.question.schema'
import { recipes } from '@/agents/brain/_schemas/recipe.schema'
import type { AdaptedEncoreRecipe } from './adapt.encore.constraints.helper'
import type { EncoreSourcingItem } from './check.encore.sourcing.helper'

export async function writeEncoreRecipe(
	db: BrainDatabase,
	input: {
		userId: string
		encoreId: string
		adapted: AdaptedEncoreRecipe
		sourcing: EncoreSourcingItem[]
		originCity?: string
		originPlaceId?: string
		capturedAt: number
	},
): Promise<{ recipeId: string }> {
	const recipeId = createId()
	const now = Date.now()

	const contentWithMeta = {
		...input.adapted.recipe,
		encoreMeta: {
			techniqueNotes: input.adapted.techniqueNotes,
			adaptationNotes: input.adapted.adaptationNotes,
			sourcing: input.sourcing,
		},
	}

	await db.transaction(async (tx) => {
		await tx.insert(recipes).values({
			id: recipeId,
			userId: input.userId,
			title: input.adapted.recipe.title,
			origin: 'encore',
			content: JSON.stringify(contentWithMeta),
			confidence: input.adapted.recipe.confidence,
			createdAt: now,
			updatedAt: now,
		})

		await tx.insert(encores).values({
			id: input.encoreId,
			userId: input.userId,
			recipeId,
			originPlaceId: input.originPlaceId,
			originCity: input.originCity,
			capturedAt: input.capturedAt,
			status: 'draft',
			photoRefsDiscarded: true,
			createdAt: now,
			updatedAt: now,
		})

		for (const question of input.adapted.openQuestions) {
			await tx.insert(encoreOpenQuestions).values({
				id: createId(),
				encoreId: input.encoreId,
				component: question.component,
				questionText: question.questionText,
				resolved: false,
				createdAt: now,
			})
		}
	})

	return { recipeId }
}
```
