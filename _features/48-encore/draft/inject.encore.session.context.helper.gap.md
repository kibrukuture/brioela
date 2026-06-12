# Draft: inject.encore.session.context.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/encore/inject.encore.session.context.helper.ts`

**Gap (feature 48):** First-cook Mira session payload extension — consumed by **29**.

**Source:** `build-guide/31-encore/04-first-cook-refinement.md`

```typescript
import { eq } from 'drizzle-orm'
import type { BrainDatabase } from '@/agents/brain/database'
import { encores } from '@/agents/brain/_schemas/encore.schema'
import { encoreOpenQuestions } from '@/agents/brain/_schemas/encore.open.question.schema'
import { recipes } from '@/agents/brain/_schemas/recipe.schema'

export type EncoreSessionContext = {
	openQuestions: Array<{ component: string; questionText: string }>
	estimatedFields: string[]
	techniqueNotes: string[]
	tasteCheckBudgetRemaining: number
}

const MAX_TASTE_CHECKS_PER_SESSION = 2

export async function injectEncoreSessionContext(
	db: BrainDatabase,
	recipeId: string,
): Promise<EncoreSessionContext | null> {
	const encore = await db.query.encores.findFirst({
		where: eq(encores.recipeId, recipeId),
	})

	if (!encore || encore.status === 'stable') return null

	const openQuestions = await db.query.encoreOpenQuestions.findMany({
		where: eq(encoreOpenQuestions.encoreId, encore.id),
	})

	const unresolved = openQuestions.filter((q) => !q.resolved)

	const recipeRow = await db.query.recipes.findFirst({
		where: eq(recipes.id, recipeId),
	})

	const content = recipeRow ? JSON.parse(recipeRow.content) : {}
	const meta = content.encoreMeta ?? {}

	return {
		openQuestions: unresolved.map((q) => ({
			component: q.component,
			questionText: q.questionText,
		})),
		estimatedFields: extractEstimatedFields(content),
		techniqueNotes: meta.techniqueNotes ?? [],
		tasteCheckBudgetRemaining: Math.min(MAX_TASTE_CHECKS_PER_SESSION, unresolved.length),
	}
}

function extractEstimatedFields(content: Record<string, unknown>): string[] {
	const ingredients = Array.isArray(content.ingredients) ? content.ingredients : []
	return ingredients
		.filter((i: { estimated?: boolean; name?: string }) => i.estimated && i.name)
		.map((i: { name: string }) => i.name)
}
```
