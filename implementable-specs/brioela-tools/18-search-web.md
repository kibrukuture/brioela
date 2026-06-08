# Tool: search_web

## Purpose

`search_web` gives the agent access to live web results mid-conversation. The 17 SQLite tools handle everything internal — user facts, skills, recipes, constraints, history. `search_web` handles everything external: current information the DO does not have, ingredient research, nutritional data, cultural food context, recipe inspiration, health guidance.

This tool is different from all other tools in one critical way: it calls an external API, not SQLite. The Brain executes it (same as all tools), but execution involves an outbound HTTP fetch to Tavily or Exa depending on `search_type`.

---

## When to Call It

Call `search_web` when the user needs information that cannot come from the user's stored data:

- "What is the glycemic index of teff?" → factual lookup, not in user_memory
- "Find me a traditional recipe for injera" → external recipe research
- "Is berbere safe during pregnancy?" → health guidance requiring current information
- "What are the health benefits of fermented foods?" → open research question
- "How long does doro wat keep in the fridge?" → food safety fact

Do NOT call `search_web` when the answer is in the user's stored data — always check internal tools first:
- User's recipe → `view_user_recipe`
- User's dietary facts → `read_user_memory`
- User's past sessions on this topic → `search_session_history`

---

## Input Schema

```typescript
import { z } from 'zod'

export const SearchWebSchema = z.object({
  query: z.string()
    .min(3,  'Query too short — minimum 3 characters')
    .max(300, 'Query too long — maximum 300 characters'),
  // The search query exactly as the agent would type it.
  // Write queries in clear natural language — not keyword strings.
  // Good: "traditional Ethiopian injera fermentation time"
  // Bad:  "injera ferment time Ethiopian"

  search_type: z.enum(['factual', 'research']).default('factual'),
  // 'factual' → Tavily. Use for specific questions with a clear answer:
  //   glycemic index, food safety rules, single-fact lookups, recipe ingredients.
  // 'research' → Exa. Use for conceptual questions with no single answer:
  //   health benefit overviews, technique comparisons, cultural food history.
  // When unsure: default to 'factual'.

  max_results: z.number().int().min(1).max(10).default(5),
  // How many results to return. Default 5 is enough for most queries.
  // Use 10 when the agent needs broad coverage (multiple sources to compare).
  // Use 1–3 when one authoritative source is enough.

  include_full_content: z.boolean().default(false),
  // false (default): returns title + URL + clean snippet per result. Fast, cheap.
  // true: returns full extracted page text per result. Slower, more expensive.
  // Use true only when the snippet is not enough — e.g., the agent needs to
  // read a full recipe or a full ingredient breakdown, not just a summary.
})
```

---

## Provider Routing — Internal, Not Exposed to Agent

The agent specifies `search_type`. The Brain maps this to a provider internally. The agent never knows or cares which API was called.

| search_type | Provider | API endpoint | Cost |
|---|---|---|---|
| `factual` | Tavily | `https://api.tavily.com/search` | ~$0.008/query |
| `research` | Exa | `https://api.exa.ai/search` | ~$0.007–0.012/query |

### Tavily call (factual)

```typescript
const tavilyResponse = await fetch('https://api.tavily.com/search', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.TAVILY_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query:               input.query,
    search_depth:        'basic',                    // 'advanced' costs 2x — use only if basic fails
    max_results:         input.max_results,
    include_raw_content: input.include_full_content, // full page text if requested
    include_answer:      false,                      // we want sources, not a Tavily pre-answer
  }),
})
const tavily = await tavilyResponse.json()

// Normalize to common output shape
const results = tavily.results.map((r: TavilyResult) => ({
  title:          r.title,
  url:            r.url,
  snippet:        r.content,
  content:        r.raw_content ?? undefined,
  published_date: r.published_date ?? undefined,
}))
```

### Exa call (research)

```typescript
const exaResponse = await fetch('https://api.exa.ai/search', {
  method: 'POST',
  headers: {
    'x-api-key':    env.EXA_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query:      input.query,
    numResults: input.max_results,
    type:       'neural',    // always neural — that is why we use Exa
    contents: input.include_full_content
      ? { text: { maxCharacters: 3000 } }
      : { highlights: { numSentences: 3, highlightsPerUrl: 1 } },
  }),
})
const exa = await exaResponse.json()

// Normalize to common output shape
const results = exa.results.map((r: ExaResult) => ({
  title:          r.title,
  url:            r.url,
  snippet:        r.highlights?.[0] ?? r.text?.slice(0, 400) ?? '',
  content:        input.include_full_content ? r.text : undefined,
  published_date: r.publishedDate ?? undefined,
}))
```

---

## What It Returns

```typescript
interface SearchWebResult {
  results: Array<{
    title:          string
    url:            string
    snippet:        string    // clean text — LLM-ready, no HTML
    content?:       string    // full page text, only if include_full_content: true
    published_date?: string   // ISO date string if available, undefined otherwise
  }>
  query:        string
  search_type:  'factual' | 'research'
  provider:     'tavily' | 'exa'
  result_count: number
}
```

Example response:

```json
{
  "results": [
    {
      "title": "Glycemic Index of Teff — Nutrition Data",
      "url": "https://example.com/teff-glycemic-index",
      "snippet": "Teff has a glycemic index of approximately 57, placing it in the low-to-medium GI range. This makes it a suitable grain for blood sugar management.",
      "published_date": "2024-11-01"
    },
    {
      "title": "Teff Grain Health Benefits",
      "url": "https://example.com/teff-benefits",
      "snippet": "Teff is high in resistant starch, which slows glucose absorption. Its GI of 57 is notably lower than white rice (GI 72) or white bread (GI 75).",
      "published_date": "2025-02-14"
    }
  ],
  "query": "glycemic index of teff",
  "search_type": "factual",
  "provider": "tavily",
  "result_count": 2
}
```

---

## Side Effect — Log to memory_event

Every `search_web` call is logged to `memory_event` as a fire-and-forget side effect. The agent does not await this. It does not affect the response.

```typescript
ctx.waitUntil(
  db.insert(memoryEvent).values({
    id:         crypto.randomUUID(),
    userId:     ctx.userId,
    sessionId:  input.session_id,
    eventType:  'web_search',
    source:     'web_search',
    content:    JSON.stringify({
      query:        input.query,
      search_type:  input.search_type,
      provider:     provider,
      result_count: results.length,
      top_urls:     results.slice(0, 3).map(r => r.url),
    }),
    createdAt:  Date.now(),
  }).run()
)
```

Why log web searches to memory_event:
- Creates a searchable record of what the user asked about externally — the Curator can eventually see what gaps in the user's stored knowledge triggered external lookups
- Diagnostic trail — if the agent returned bad information, the log shows exactly what query was run and what provider was used
- Consistent with the observability principle: silent external calls should never be invisible

---

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Query too short/long, invalid search_type | Zod error with failing field |
| `web_search_unavailable` | `TAVILY_API_KEY` or `EXA_API_KEY` missing from env | `{ error: 'web_search_unavailable', message: 'Web search is not configured' }` |
| `search_failed` | API request failed — network error, rate limit, provider outage | `{ error: 'search_failed', message: err.message, provider }` |
| Empty results | Valid query, no matching results | `{ results: [], result_count: 0 }` — not an error, agent handles gracefully |

On `search_failed`, the failure is also logged to `agent_state`:

```typescript
db.insert(agentState).values({
  key:       `web_search.failure.${sessionId}`,
  userId:    ctx.userId,
  value:     JSON.stringify({ query: input.query, provider, error: err.message, ts: Date.now() }),
  updatedAt: Date.now(),
}).onConflictDoUpdate({
  target:  agentState.key,
  set:     { value: sql`excluded.value`, updatedAt: Date.now() },
}).run()
```

---

## Who Can Call It

Controlled by `TOOL_PERMISSIONS` in the Brain.

| Caller | Allowed | Reason |
|---|---|---|
| `chat` | ✓ | Core use case — user asks factual or research questions mid-conversation |
| `cooking` | ✓ | Agent may need to look up food safety, substitutions, or technique during a session |
| `product_scan` | ✓ | May need to look up ingredient details not in user's stored data |
| `curator` | ✗ | Curator works entirely on internal data — no external lookups needed |
| `pattern_detection` | ✗ | Works on raw internal events — no external lookups needed |

---

## TOOL_PERMISSIONS Update

Add `search_web` to the `cooking` entry and to the `chat` entry (which does not exist yet in the map — add it):

```typescript
const TOOL_PERMISSIONS: Record<string, string[]> = {
  // ... existing entries ...
  cooking: [
    'write_user_memory',
    'create_user_skill',
    'log_memory_event',
    'view_user_recipe',
    'propose_user_constraint',
    'schedule_user_alarm',
    'search_web',            // ← added
  ],
  chat: [
    'write_user_memory',
    'read_user_memory',
    'log_memory_event',
    'propose_user_constraint',
    'confirm_user_constraint',
    'create_user_skill',
    'update_user_skill',
    'archive_user_skill',
    'schedule_user_alarm',
    'cancel_user_alarm',
    'search_session_history',
    'search_web',            // ← new caller, new tool
  ],
  product_scan: [
    'log_memory_event',
    'write_user_memory',
    'propose_user_constraint',
    'search_web',            // ← new caller, new tool
  ],
}
```

---

## What Is NOT This Tool's Job

- Searching past Brioela sessions → `search_session_history`
- Reading user's stored facts → `read_user_memory`
- Loading a specific stored recipe → `view_user_recipe`
- Scraping full websites for bulk data ingestion → not supported; use `include_full_content: true` for a single page
- Any write to any table → this tool is pure read plus one fire-and-forget log
