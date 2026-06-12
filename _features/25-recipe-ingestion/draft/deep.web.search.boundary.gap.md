# Gap note: deep web search boundary (25 vs 18)

**25** owns async import-pipeline public web search when recipe evidence is incomplete.

**18** owns live-session `search_web` Brain tool (Tavily factual + Exa research).

| Dimension | **25** `deepWebSearchRecipeEvidence` | **18** `search_web` tool |
|---|---|---|
| Trigger | Import workflow step 5 | Agent mid-chat/cooking turn |
| Runtime | Upstash Workflow worker | Brain DO tool executable |
| Rate limit | Per import job (define at build) | 5 calls / session |
| Query shape | Dish + creator from share artifacts | User natural language |
| Result use | Corroborate normalization only | Agent cites in conversation |
| Observability | Job artifacts + attribution URLs | `memory_event` kind `web_search` |
| Provider | Tavily (likely same keys) | Tavily + Exa per implementable spec 18 |

**Do not** route import deep search through `searchWebExecutable` — different contracts, permissions, and session context.

Reference: `_features/18-brain-web-search/draft/search.web.tool-boundary.gap.md`
