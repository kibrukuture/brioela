# Draft: semantic.search.sessions.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/semantic.search.sessions.repository.ts`

**Gap (feature 17):** Internal semantic query — **not** the **16** FTS tool.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { embedText } from '@/agents/brain/_helpers/embed.text.helper'
import { getSessionVectorNamespace } from '@/agents/brain/_helpers/get.shard.index.helper'
import { getVectorIndex } from '@/agents/brain/_helpers/get.vector.index.helper'
import { sessions } from '@/agents/brain/_schemas/session.schema'
import { getMany, inArray } from '@/database/drizzle/_database'

export const SEMANTIC_SIMILARITY_THRESHOLD = 0.65 as const
export const SEMANTIC_DEFAULT_TOP_K = 10 as const

export type SemanticSearchSessionsOptions = {
	sessionType?: string
	sinceTs?: number
	recipeId?: string
	topK?: number
}

export type SemanticSessionHit = {
	id: string
	session_type: string
	outcome_summary: string
	recipe_id: string | null
	ended_at: number
	similarity_score: number
}

export async function semanticSearchSessions(
	db: BrainDatabase,
	env: Env,
	userId: string,
	query: string,
	options: SemanticSearchSessionsOptions = {},
): Promise<SemanticSessionHit[]> {
	const topK = options.topK ?? SEMANTIC_DEFAULT_TOP_K
	const queryVector = await embedText(query, 'search_query', env)

	const filter: VectorizeVectorMetadataFilter = {}
	if (options.sessionType) {
		filter.session_type = { $eq: options.sessionType }
	}
	if (options.sinceTs !== undefined) {
		filter.ended_at = { $gte: options.sinceTs }
	}

	const index = getVectorIndex(userId, env)
	const namespace = getSessionVectorNamespace(userId)

	const results = await index.query(queryVector, {
		topK,
		namespace,
		filter: Object.keys(filter).length > 0 ? filter : undefined,
		returnMetadata: 'all',
	})

	const matched = results.matches.filter((m) => m.score >= SEMANTIC_SIMILARITY_THRESHOLD)
	if (matched.length === 0) {
		return []
	}

	let filtered = matched
	if (options.recipeId) {
		filtered = matched.filter((m) => {
			const meta = m.metadata
			return meta && meta.recipe_id === options.recipeId
		})
	}
	if (filtered.length === 0) {
		return []
	}

	const sessionIds = filtered.map((m) => m.id)
	const sessionRows = getMany(
		db.select({
			id: sessions.id,
			sessionType: sessions.sessionType,
			outcomeSummary: sessions.outcomeSummary,
			recipeId: sessions.recipeId,
			endedAt: sessions.endedAt,
		})
			.from(sessions)
			.where(inArray(sessions.id, sessionIds)),
	)

	return filtered
		.map((match) => {
			const session = sessionRows.find((s) => s.id === match.id)
			if (!session || !session.outcomeSummary || session.endedAt === null) {
				return null
			}
			return {
				id: session.id,
				session_type: session.sessionType,
				outcome_summary: session.outcomeSummary,
				recipe_id: session.recipeId,
				ended_at: session.endedAt,
				similarity_score: match.score,
			}
		})
		.filter((row): row is SemanticSessionHit => row !== null)
}
```

Export from `_repositories/index.ts`.

**Caller:** **20** chat runtime — not **16** `search.session.history.executable.ts`.

**Ordering:** Similarity score from Vectorize (not `ended_at` — differs from FTS tool **16**).
