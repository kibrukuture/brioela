# Gap snapshot: write.imported.recipe.helper.ts

Target: `backend/src/api/recipes/_helpers/write.imported.recipe.helper.ts`

**Status:** Not in repo. Brain RPC write — uses **08** `writeUserRecipe` inside DO.

```typescript
import { createId } from '@brioela/shared/id'
import type { NormalizedRecipeContent } from '@/agents/brain/_schemas/normalized.recipe.content.schema'
import type { RecipeShareInput } from '@brioela/shared/validator/recipe.import'

type BrainEnv = {
	BRAIN: DurableObjectNamespace
}

export async function writeImportedRecipeToBrain(
	env: BrainEnv,
	userId: string,
	content: NormalizedRecipeContent,
	shareInput: RecipeShareInput,
): Promise<{ recipeId: string }> {
	const brainId = env.BRAIN.idFromName(userId)
	const brain = env.BRAIN.get(brainId)

	const response = await brain.fetch(
		new Request('https://internal/write-imported-recipe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				origin: 'share_import',
				linkUrl: shareInput.sourceUrl,
				content,
				confidence: content.confidence,
			}),
		}),
	)

	if (!response.ok) {
		throw new Error(`Brain write-imported-recipe failed: ${response.status}`)
	}

	const payload = (await response.json()) as { recipeId: string }
	return payload
}

// Brain DO handler (register in brioela.brain.agent.ts fetch):
export function handleWriteImportedRecipeInternal(
	db: import('@/agents/brain/_database').BrainDatabase,
	body: {
		userId: string
		origin: 'share_import'
		linkUrl: string | null
		content: NormalizedRecipeContent
		confidence: number
	},
): { recipeId: string } {
	const { writeUserRecipe } = require('@/agents/brain/_repositories/write.user.recipe.repository')
	const now = Date.now()
	const recipeId = createId()
	const contentJson = JSON.stringify(body.content)

	writeUserRecipe(db, {
		id: recipeId,
		userId: body.userId,
		title: body.content.title,
		origin: body.origin,
		sessionId: null,
		linkUrl: body.linkUrl,
		content: contentJson,
		version: 1,
		cookCount: 0,
		lastCookedAt: null,
		status: 'active',
		confidence: body.confidence,
		createdAt: now,
		updatedAt: now,
	})

	return { recipeId }
}
```
