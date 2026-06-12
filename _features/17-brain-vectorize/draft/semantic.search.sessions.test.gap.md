# Draft: semantic.search.sessions.test.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/semantic.search.sessions.test.ts`

**Gap (feature 17):** Test similarity threshold, namespace scoping, and SQLite hydrate ordering.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { describe, expect, test, mock } from 'bun:test'
import {
	SEMANTIC_SIMILARITY_THRESHOLD,
	semanticSearchSessions,
} from '@/agents/brain/_repositories/semantic.search.sessions.repository'

describe('semanticSearchSessions', () => {
	test('filters matches below similarity threshold', async () => {
		const mockIndex = {
			query: mock(async () => ({
				matches: [
					{ id: 'session-a', score: 0.9, metadata: { session_type: 'chat', ended_at: 1, recipe_id: '' } },
					{ id: 'session-b', score: 0.5, metadata: { session_type: 'chat', ended_at: 1, recipe_id: '' } },
				],
			})),
		}

		const env = { COHERE_API_KEY: 'test', SESSIONS_VEC_0: mockIndex } as unknown as Env

		globalThis.fetch = mock(async () =>
			new Response(JSON.stringify({ embeddings: [Array(768).fill(0.1)] }), { status: 200 }),
		) as typeof fetch

		// Requires test Brain DB with session-a row seeded — extend when harness exists
		expect(SEMANTIC_SIMILARITY_THRESHOLD).toBe(0.65)
	})
})
```

**Full integration:** Seed `sessions` row, mock Vectorize `query` returning ID, assert `similarity_score` preserved and weak matches excluded.

**Isolation test:** Query with `namespace: userA` must not return userB vectors (Vectorize enforces namespace — verify binding call args).

Run: `cd backend && bun test src/agents/brain/_repositories/semantic.search.sessions.test.ts`
