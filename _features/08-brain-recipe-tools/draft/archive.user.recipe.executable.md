# Draft: archive.user.recipe.executable

Target: `backend/src/agents/brain/_tools/_executables/archive.user.recipe.executable.ts`

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { archiveUserRecipe, readUserRecipe } from '@/agents/brain/_repositories'
import type { archiveUserRecipeSchema } from '@/agents/brain/_tools/_schemas/archive.user.recipe.schema'
import { readCurrentEpochMs } from '@/time/_helpers'
import type { z } from '@brioela/shared/zod'

export const archiveUserRecipeExecutable = async (
	database: BrainDatabase,
	input: z.infer<typeof archiveUserRecipeSchema>,
) => {
	const recipe = readUserRecipe(database, input.id)
	if (!recipe) {
		return { error: 'recipe_not_found', id: input.id }
	}

	if (recipe.status === 'archived') {
		return {
			error: 'already_archived',
			id: input.id,
			title: recipe.title,
			hint: 'Recipe is already archived.',
		}
	}

	archiveUserRecipe(database, input.id, readCurrentEpochMs())

	return {
		id: input.id,
		title: recipe.title,
		status: 'archived' as const,
		cook_count: recipe.cookCount,
		last_cooked_at: recipe.lastCookedAt,
	}
}
```
