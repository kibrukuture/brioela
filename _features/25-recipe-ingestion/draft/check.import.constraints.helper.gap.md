# Gap snapshot: check.import.constraints.helper.ts

Target: `backend/src/api/recipes/_helpers/check.import.constraints.helper.ts`

**Status:** Not in repo. Orchestration only — **07** owns matching logic. Pattern from **24** `check.constraints.helper`.

```typescript
import type { NormalizedRecipeContent } from '@/agents/brain/_schemas/normalized.recipe.content.schema'
import { deriveIngredientNames } from '@/agents/brain/_schemas/normalized.recipe.content.schema'

type BrainEnv = { BRAIN: DurableObjectNamespace }

export type ImportConstraintResult = {
	status: 'clear' | 'caution' | 'blocked'
	warnings: string[]
	findings: Array<{
		ingredientName: string
		constraintType: string
		severity: 'hard' | 'soft'
		message: string
	}>
}

export async function checkImportConstraints(
	env: BrainEnv,
	userId: string,
	content: NormalizedRecipeContent,
): Promise<ImportConstraintResult> {
	const ingredientNames = deriveIngredientNames(content)
	const brainId = env.BRAIN.idFromName(userId)
	const brain = env.BRAIN.get(brainId)

	const response = await brain.fetch(
		new Request('https://internal/check-constraints', {
			method: 'POST',
			body: JSON.stringify({ ingredientNames }),
		}),
	)

	if (!response.ok) {
		return { status: 'caution', warnings: ['constraint_check_unavailable'], findings: [] }
	}

	const payload = (await response.json()) as ImportConstraintResult
	return payload
}
```
