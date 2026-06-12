# Draft: reconstruct.encore.recipe.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/encore/reconstruct.encore.recipe.helper.ts`

**Gap (feature 48):** Workflow step 3 — structured recipe + open questions.

```typescript
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from '@brioela/shared/zod'
import { normalizedRecipeContentSchema } from '@brioela/shared/validator/recipe/normalized.recipe.content.schema'
import type { FusedEncoreContext } from './fuse.encore.context.helper'

const reconstructionResultSchema = z.object({
	recipe: normalizedRecipeContentSchema,
	openQuestions: z.array(
		z.object({
			component: z.string(),
			questionText: z.string(),
		}),
	),
	techniqueNotes: z.array(z.string()),
})

export type EncoreReconstructionResult = z.infer<typeof reconstructionResultSchema>

export async function reconstructEncoreRecipe(
	context: FusedEncoreContext,
): Promise<EncoreReconstructionResult> {
	const { object } = await generateObject({
		model: openai('gpt-4o-mini'),
		schema: reconstructionResultSchema,
		prompt: buildReconstructionPrompt(context),
	})

	return object
}

function buildReconstructionPrompt(context: FusedEncoreContext): string {
	return `
Reconstruct a cookable recipe from the fused context below.
Use spec 02 shape with per-field confidence. Mark uncertain quantities estimated.
For unresolvable components, add openQuestions for first-cook taste-checks.
Never fabricate certainty.

${JSON.stringify(context, null, 2)}
`
}
```
