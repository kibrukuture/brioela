# Draft: write.user.recipe.repository

Target: `backend/src/agents/brain/_repositories/write.user.recipe.repository.ts`

```typescript
import { eq, getReturned } from '@/database/drizzle/_database'
import {
	recipeVersions,
	recipes,
	type BrainRecipe,
	type NewBrainRecipe,
	type NewBrainRecipeVersion,
} from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'

export function writeUserRecipe(
	database: BrainDatabase,
	values: NewBrainRecipe,
): BrainRecipe {
	return getReturned(
		database
			.insert(recipes)
			.values(values)
			.returning(),
	)
}

export function archiveUserRecipe(
	database: BrainDatabase,
	id: string,
	updatedAt: number,
): BrainRecipe {
	return getReturned(
		database
			.update(recipes)
			.set({
				status: 'archived',
				updatedAt,
			})
			.where(eq(recipes.id, id))
			.returning(),
	)
}

type ReplaceUserRecipeContentInput = {
	recipeId: string
	archive: NewBrainRecipeVersion
	newContent: string
	newTitle: string
	newVersion: number
	updatedAt: number
}

export function replaceUserRecipeContent(
	database: BrainDatabase,
	input: ReplaceUserRecipeContentInput,
): BrainRecipe {
	return database.transaction((tx) => {
		getReturned(
			tx
				.insert(recipeVersions)
				.values(input.archive)
				.returning(),
		)

		return getReturned(
			tx
				.update(recipes)
				.set({
					content: input.newContent,
					title: input.newTitle,
					version: input.newVersion,
					updatedAt: input.updatedAt,
				})
				.where(eq(recipes.id, input.recipeId))
				.returning(),
		)
	})
}
```
