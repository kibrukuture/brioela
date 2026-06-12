# Gap snapshot: deep.web.search.recipe.helper.ts

Target: `backend/src/api/recipes/_helpers/deep.web.search.recipe.helper.ts`

**Status:** Not in repo. **25** pipeline step — **not** Brain `search_web` tool (**18**).

```typescript
import type { RecipeSourceArtifacts } from '@brioela/shared/validator/recipe.import'

type DeepSearchEnv = {
	TAVILY_API_KEY?: string
	EXA_API_KEY?: string
}

export type DeepWebSearchEvidence = {
	url: string
	title: string
	snippet: string
	sourceMatch: 'same_creator' | 'same_canonical' | 'weak_hint'
}

export type DeepWebSearchResult = {
	evidence: DeepWebSearchEvidence[]
	query: string
	provider: 'tavily' | 'exa' | 'none'
}

function buildRecipeSearchQuery(artifacts: RecipeSourceArtifacts): string | null {
	const dish = artifacts.title ?? artifacts.captions?.slice(0, 80)
	if (!dish) return null
	const author = artifacts.authorName ? ` by ${artifacts.authorName}` : ''
	return `${dish}${author} recipe ingredients steps`
}

export async function deepWebSearchRecipeEvidence(
	artifacts: RecipeSourceArtifacts,
	env: DeepSearchEnv,
): Promise<DeepWebSearchResult> {
	const query = buildRecipeSearchQuery(artifacts)
	if (!query || !env.TAVILY_API_KEY) {
		return { evidence: [], query: query ?? '', provider: 'none' }
	}

	const response = await fetch('https://api.tavily.com/search', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			api_key: env.TAVILY_API_KEY,
			query,
			search_depth: 'basic',
			max_results: 5,
			include_answer: false,
		}),
	})

	if (!response.ok) {
		return { evidence: [], query, provider: 'tavily' }
	}

	const payload = (await response.json()) as {
		results?: Array<{ url: string; title: string; content: string }>
	}

	const canonical = artifacts.canonicalUrl?.replace(/\/$/, '')
	const evidence: DeepWebSearchEvidence[] = (payload.results ?? []).map((row) => {
		const sameCanonical = canonical && row.url.replace(/\/$/, '').startsWith(canonical)
		return {
			url: row.url,
			title: row.title,
			snippet: row.content.slice(0, 500),
			sourceMatch: sameCanonical ? 'same_canonical' : 'weak_hint',
		}
	})

	return { evidence, query, provider: 'tavily' }
}
```
