# Draft: finalize.heritage.recipe.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/heritage/finalize.heritage.recipe.helper.ts`

---

```typescript
import { createId } from '@brioela/shared/id'
import type { NormalizedRecipeContent } from '@brioela/shared/validator/recipe/normalized.recipe.content.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { heritageRecipeCaptures } from '@/agents/brain/_schemas/heritage.recipe.capture.schema'
import { writeUserRecipe } from '@/agents/brain/_repositories/write.user.recipe.repository'
import { eq } from 'drizzle-orm'

export async function finalizeHeritageRecipeHelper(
	db: BrainDatabase,
	userId: string,
	captureId: string,
	content: NormalizedRecipeContent,
): Promise<{ recipeId: string }> {
	const recipeId = createId()
	const now = Date.now()

	await writeUserRecipe(db, {
		id: recipeId,
		userId,
		origin: 'family_capture',
		content,
		createdAt: now,
		updatedAt: now,
	})

	await db
		.update(heritageRecipeCaptures)
		.set({ status: 'finalized', recipeId, updatedAt: now })
		.where(eq(heritageRecipeCaptures.id, captureId))

	return { recipeId }
}
```
