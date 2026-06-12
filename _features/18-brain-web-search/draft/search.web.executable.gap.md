# Draft: search.web.executable.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_tools/_executables/search.web.executable.ts`

**Gap (feature 18):** Tavily/Exa HTTP fetch, 5-call session rate limit, normalized response, fire-and-forget `memory_event` log, `agent_state` failure write.

**Provider:** Tavily (`factual`) + Exa (`research`) per implementable spec — **not** Brave (ledger 0007 obsolete).

---

## Intended production file (full snapshot — not yet created)

```typescript
import { createId } from '@brioela/shared/_ids'
import type { BrainDatabase } from '@/agents/brain/_database'
import { writeMemoryEvent } from '@/agents/brain/_repositories'
import { logWebSearchFailure } from '@/agents/brain/_repositories/log.web.search.failure.repository'
import type { SearchWebParams, SearchWebSearchType } from '@/agents/brain/_tools/_schemas/search.web.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export const SESSION_WEB_SEARCH_LIMIT = 5 as const

export type SessionWebSearchCounter = { count: number }

export type SearchWebProvider = 'tavily' | 'exa'

export type SearchWebResultItem = {
	title: string
	url: string
	snippet: string
	content?: string
	published_date?: string
}

export type SearchWebSuccess = {
	results: SearchWebResultItem[]
	query: string
	search_type: SearchWebSearchType
	provider: SearchWebProvider
	result_count: number
}

type TavilyApiResult = {
	title?: string
	url?: string
	content?: string
	raw_content?: string
	published_date?: string
}

type TavilyApiResponse = {
	results?: TavilyApiResult[]
}

type ExaApiResult = {
	title?: string
	url?: string
	text?: string
	highlights?: string[]
	publishedDate?: string
}

type ExaApiResponse = {
	results?: ExaApiResult[]
}

type SearchWebEnv = Pick<Env, 'TAVILY_API_KEY' | 'EXA_API_KEY'>

function resolveProvider(searchType: SearchWebSearchType): SearchWebProvider {
	return searchType === 'research' ? 'exa' : 'tavily'
}

function normalizeTavilyResults(
	raw: TavilyApiResult[],
	includeFullContent: boolean,
): SearchWebResultItem[] {
	return raw.map((row) => ({
		title: row.title ?? '',
		url: row.url ?? '',
		snippet: row.content ?? '',
		content: includeFullContent ? row.raw_content : undefined,
		published_date: row.published_date,
	}))
}

function normalizeExaResults(
	raw: ExaApiResult[],
	includeFullContent: boolean,
): SearchWebResultItem[] {
	return raw.map((row) => ({
		title: row.title ?? '',
		url: row.url ?? '',
		snippet: row.highlights?.[0] ?? row.text?.slice(0, 400) ?? '',
		content: includeFullContent ? row.text : undefined,
		published_date: row.publishedDate,
	}))
}

async function fetchTavily(
	apiKey: string,
	params: SearchWebParams,
): Promise<SearchWebResultItem[]> {
	const response = await fetch('https://api.tavily.com/search', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: params.query,
			search_depth: 'basic',
			max_results: params.max_results,
			include_raw_content: params.include_full_content,
			include_answer: false,
		}),
	})

	if (!response.ok) {
		throw new Error(`Tavily HTTP ${response.status}`)
	}

	const body = (await response.json()) as TavilyApiResponse
	return normalizeTavilyResults(body.results ?? [], params.include_full_content)
}

async function fetchExa(
	apiKey: string,
	params: SearchWebParams,
): Promise<SearchWebResultItem[]> {
	const response = await fetch('https://api.exa.ai/search', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			query: params.query,
			numResults: params.max_results,
			type: 'neural',
			contents: params.include_full_content
				? { text: { maxCharacters: 3000 } }
				: { highlights: { numSentences: 3, highlightsPerUrl: 1 } },
		}),
	})

	if (!response.ok) {
		throw new Error(`Exa HTTP ${response.status}`)
	}

	const body = (await response.json()) as ExaApiResponse
	return normalizeExaResults(body.results ?? [], params.include_full_content)
}

function scheduleWebSearchMemoryEvent(
	database: BrainDatabase,
	userId: string,
	activeSessionId: string | null,
	payload: {
		query: string
		search_type: SearchWebSearchType
		provider: SearchWebProvider
		result_count: number
		top_urls: string[]
	},
	waitUntil?: (promise: Promise<void>) => void,
): void {
	const task = Promise.resolve().then(() => {
		const now = readCurrentEpochMs()
		writeMemoryEvent(database, {
			id: createId(),
			userId,
			kind: 'web_search',
			payloadJson: JSON.stringify(payload),
			capturedAt: now,
			ingestedAt: now,
			source: 'search_web',
			sessionId: activeSessionId,
		})
	})

	if (waitUntil) {
		waitUntil(task)
	}
}

export const searchWebExecutable = async (
	database: BrainDatabase,
	userId: string,
	activeSessionId: string | null,
	env: SearchWebEnv,
	sessionWebSearchCounter: SessionWebSearchCounter,
	params: SearchWebParams,
	waitUntil?: (promise: Promise<void>) => void,
): Promise<SearchWebSuccess | { error: string; message: string; provider?: SearchWebProvider; limit?: number; count?: number }> => {
	if (sessionWebSearchCounter.count >= SESSION_WEB_SEARCH_LIMIT) {
		return {
			error: 'session_web_search_limit_reached',
			message: `Web search limit reached (${SESSION_WEB_SEARCH_LIMIT} calls per session).`,
			limit: SESSION_WEB_SEARCH_LIMIT,
			count: sessionWebSearchCounter.count,
		}
	}

	const provider = resolveProvider(params.search_type)
	const apiKey = provider === 'tavily' ? env.TAVILY_API_KEY : env.EXA_API_KEY

	if (!apiKey) {
		return {
			error: 'web_search_unavailable',
			message: 'Web search is not configured',
			provider,
		}
	}

	sessionWebSearchCounter.count += 1

	try {
		const results =
			provider === 'tavily'
				? await fetchTavily(apiKey, params)
				: await fetchExa(apiKey, params)

		const success: SearchWebSuccess = {
			results,
			query: params.query,
			search_type: params.search_type,
			provider,
			result_count: results.length,
		}

		scheduleWebSearchMemoryEvent(
			database,
			userId,
			activeSessionId,
			{
				query: params.query,
				search_type: params.search_type,
				provider,
				result_count: results.length,
				top_urls: results.slice(0, 3).map((row) => row.url),
			},
			waitUntil,
		)

		return success
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown search error'

		if (activeSessionId) {
			logWebSearchFailure(database, userId, activeSessionId, {
				query: params.query,
				provider,
				error: message,
				ts: readCurrentEpochMs(),
			})
		}

		return {
			error: 'search_failed',
			message,
			provider,
		}
	}
}
```

Add to `_tools/_executables/index.ts`:

```typescript
export * from './search.web.executable'
```

**Note:** Implementable spec pseudocode used `eventType`/`content` — production uses `kind`/`payloadJson` per `memory.event.schema.ts`.
