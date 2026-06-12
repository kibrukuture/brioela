# Draft: wrangler secrets — web search API keys (gap)

**Gap (feature 18):** `TAVILY_API_KEY` and `EXA_API_KEY` not configured. `wrangler.jsonc` has no secret references (secrets are never inlined in wrangler file).

**Obsolete:** Ledger `0007` `BRAVE_SEARCH_API_KEY` — **do not ship** without spec change.

---

## Intended worker Env extension

Add to generated `Env` interface (via wrangler types or manual `worker-configuration.d.ts` augmentation):

```typescript
interface Env {
	// ... existing bindings ...
	TAVILY_API_KEY: string
	EXA_API_KEY: string
}
```

## Setup commands (per environment)

```bash
bunx wrangler secret put TAVILY_API_KEY
bunx wrangler secret put EXA_API_KEY
```

## Provider endpoints (reference)

| Secret | Endpoint |
|---|---|
| `TAVILY_API_KEY` | `POST https://api.tavily.com/search` |
| `EXA_API_KEY` | `POST https://api.exa.ai/search` |

## Cloudflare Web Search binding (NOT ship path)

`worker-configuration.d.ts` documents optional managed binding:

```jsonc
{ "web_search": { "binding": "WEBSEARCH" } }
```

**Not in Brioela specs.** Discovery-only (URL + title + description) — no Tavily-style snippets or Exa neural highlights. Different contract — see **G18** in `status.md`.

## Current production `wrangler.jsonc`

Only `BRIOELA_BRAIN` Durable Object binding — no search secrets, no `web_search` binding.
