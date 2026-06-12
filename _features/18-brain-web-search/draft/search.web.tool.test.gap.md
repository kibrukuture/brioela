# Draft: search.web.tool.test.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/search.web.tool.test.ts`

**Gap (feature 18):** Verification plan from ledger `0007.web-tool.md` — mock fetch, rate limit, permission matrix.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { runInDurableObject } from 'cloudflare:test'
import { env } from 'cloudflare:workers'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { createDatabase } from '@/agents/brain/_database'
import { getBrainTools } from '@/agents/brain/_tools/get.brain.tools'
import { searchWebExecutable, SESSION_WEB_SEARCH_LIMIT } from '@/agents/brain/_tools/_executables/search.web.executable'
import { memoryEvent, agentState } from '@/agents/brain/_schemas'
import { eq } from '@/database/drizzle/_database'

const mockTavilyResponse = {
	results: [
		{
			title: 'Teff Glycemic Index',
			url: 'https://example.com/teff-gi',
			content: 'Teff GI is approximately 57.',
			published_date: '2024-11-01',
		},
	],
}

describe('search_web tool', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('calls Tavily and returns normalized results', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(JSON.stringify(mockTavilyResponse), { status: 200 }),
		)
		vi.stubGlobal('fetch', fetchMock)

		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const counter = { count: 0 }

			const response = await searchWebExecutable(
				database,
				'user-1',
				'session-1',
				{ TAVILY_API_KEY: 'test-tavily', EXA_API_KEY: 'test-exa' },
				counter,
				{ query: 'glycemic index of teff', search_type: 'factual', max_results: 5, include_full_content: false },
			)

			expect('error' in response).toBe(false)
			if ('error' in response) return

			expect(response.provider).toBe('tavily')
			expect(response.result_count).toBe(1)
			expect(response.results[0]?.url).toBe('https://example.com/teff-gi')
			expect(fetchMock).toHaveBeenCalledOnce()
		})
	})

	it('returns session_web_search_limit_reached after 5 calls', async () => {
		const fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)

		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const counter = { count: SESSION_WEB_SEARCH_LIMIT }

			const response = await searchWebExecutable(
				database,
				'user-1',
				'session-1',
				{ TAVILY_API_KEY: 'test-tavily', EXA_API_KEY: 'test-exa' },
				counter,
				{ query: 'sixth query attempt', search_type: 'factual', max_results: 5, include_full_content: false },
			)

			expect(response).toMatchObject({ error: 'session_web_search_limit_reached' })
			expect(fetchMock).not.toHaveBeenCalled()
		})
	})

	it('omits search_web from alarm tool set', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const tools = getBrainTools(
				database,
				'user-1',
				'alarm',
				'session-1',
				undefined,
				undefined,
				{ TAVILY_API_KEY: 'k', EXA_API_KEY: 'k' },
				{ count: 0 },
			)

			expect(tools.search_web).toBeUndefined()
		})
	})

	it('includes search_web in chat tool set when env and counter provided', async () => {
		const brain = env.BRIOELA_BRAIN.get(env.BRIOELA_BRAIN.newUniqueId())
		await brain.checkReadiness()

		await runInDurableObject(brain, async (_, state) => {
			const database = createDatabase(state.storage)
			const tools = getBrainTools(
				database,
				'user-1',
				'chat',
				'session-1',
				undefined,
				undefined,
				{ TAVILY_API_KEY: 'k', EXA_API_KEY: 'k' },
				{ count: 0 },
			)

			expect(tools.search_web).toBeDefined()
		})
	})
})
```

Run:

```bash
bun run brain:test
```
