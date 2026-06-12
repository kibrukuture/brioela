# Gap snapshot: normalize.recipe.helper.ts

Target: `backend/src/api/recipes/_helpers/normalize.recipe.helper.ts`

**Status:** Not in repo. `04-recipe-normalization.md`.

```typescript
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
	normalizedRecipeContentSchema,
	type NormalizedRecipeContent,
} from '@/agents/brain/_schemas/normalized.recipe.content.schema'
import type { RecipeShareInput, RecipeSourceArtifacts } from '@brioela/shared/validator/recipe.import'
import type { DeepWebSearchResult } from './deep.web.search.recipe.helper'

type NormalizeRecipeInput = {
	shareInput: RecipeShareInput
	artifacts: RecipeSourceArtifacts
	deepSearch: DeepWebSearchResult
}

export async function normalizeRecipeFromArtifacts(
	input: NormalizeRecipeInput,
): Promise<NormalizedRecipeContent> {
	const evidenceBlock = [
		input.artifacts.transcript,
		input.artifacts.captions,
		input.artifacts.extractedPageText,
		input.artifacts.extractedImageText,
		input.deepSearch.evidence.map((e) => `${e.title}: ${e.snippet} (${e.url})`).join('\n'),
	]
		.filter(Boolean)
		.join('\n\n')

	const readVia =
		input.shareInput.sourceType === 'image'
			? 'photo'
			: input.shareInput.sourceType === 'video_url'
				? 'video'
				: 'webpage'

	const { object } = await generateObject({
		model: openai('gpt-4o-mini'),
		schema: normalizedRecipeContentSchema,
		system:
			'Structure recipe evidence only. Never invent ingredients, quantities, or steps missing from evidence. Use estimated=true and low confidence for inferred values. Preserve attribution.',
		prompt: `Share metadata: ${JSON.stringify(input.shareInput)}\n\nEvidence:\n${evidenceBlock}`,
	})

	return normalizedRecipeContentSchema.parse({
		...object,
		read_via: readVia,
		link_url: input.shareInput.sourceUrl,
		shared_from: input.shareInput.sourceApp ?? 'unknown',
		attribution: {
			title: input.artifacts.title,
			authorName: input.artifacts.authorName,
			canonicalUrl: input.artifacts.canonicalUrl,
		},
	})
}
```
