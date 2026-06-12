# Brain Web Search — Spec

Feature **18**. AI-callable **`search_web`** tool inside the per-user `BrioelaBrain` Durable Object: split tool layout (schema, prompt, executable, tool), dual-provider HTTP routing (Tavily factual / Exa research), session rate limit, fire-and-forget observability writes, and `getBrainTools` permission wiring.

**Not in this feature:** internal session recall (`search_session_history` — **16**); Vectorize semantic search (**17**); recipe-ingestion “deep web search” pipeline (**25**); Mira cooking DO live lookups (**29**); Bela shopper Gemini path (**42**); Cloudflare Web Search binding as ship path (platform capability only — see conflicts); sub-agent spawn (**12**); tool registry matrix ownership (**19**); live chat turn loop that invokes tools (**20**); scanner `product_scan` session kind wiring (**24** — permission reserved, kind not in `SessionKind` today).

---

## Purpose

`search_web` is the **only Brain tool that makes an outbound network request**. All 17 SQLite tools handle internal user data. `search_web` handles external information the DO does not have: current facts, ingredient research, nutritional data, cultural food context, recipe inspiration, health guidance.

The agent calls it mid-conversation when stored data is insufficient. The Brain executes it like every other tool; execution is HTTP fetch to Tavily or Exa depending on `search_type` (internal routing — agent never chooses provider).

---

## What it is (and is not)

| Aspect | Contract |
|---|---|
| Runtime | Brain tool executable — **not** an Agent DO |
| Spawn | Never via `subAgent()` — inline `tool()` in Brain session |
| Catalog | Listed in **12** agent inventory as tool boundary only |
| Executor path | `backend/src/agents/brain/_tools/_executables/search.web.executable.ts` |
| Mira cooking | Mira may perform **separate** lookups during live cooking (**29**) — not this tool path |
| Recipe ingestion | Share-sheet pipeline may run “deep public web search” (**25**) — separate job, not `search_web` |

---

## When to call it

Call when the user needs information **not** in stored data:

- “What is the glycemic index of teff?” — factual lookup
- “Find me a traditional recipe for injera” — external recipe research
- “Is berbere safe during pregnancy?” — health guidance requiring current information
- “How long does doro wat keep in the fridge?” — food safety fact

Do **not** call when the answer is internal:

| Need | Use instead |
|---|---|
| User's recipe | `view_user_recipe` (**08**) |
| User's dietary facts | `read_user_memory` (**05**) |
| Past sessions on topic | `search_session_history` (**16**) |
| Meaning-based session recall | Vectorize internal API (**17**) — no dedicated tool |

---

## Input schema

```typescript
import { z } from '@brioela/shared/zod'

export const searchWebSchema = z.object({
  query: z.string()
    .min(3, 'Query too short — minimum 3 characters')
    .max(300, 'Query too long — maximum 300 characters'),
  // Natural language — not keyword strings.
  // Good: "traditional Ethiopian injera fermentation time"
  // Bad:  "injera ferment time Ethiopian"

  search_type: z.enum(['factual', 'research']).default('factual'),
  // 'factual' → Tavily — specific questions with a clear answer
  // 'research' → Exa — conceptual questions, no single answer
  // When unsure: default to 'factual'

  max_results: z.number().int().min(1).max(10).default(5),
  // Default 5; use 10 for broad coverage; 1–3 for single authoritative source

  include_full_content: z.boolean().default(false),
  // false: title + URL + snippet (fast)
  // true: full extracted page text per result (slower, costlier)
})
```

**Authority:** `implementable-specs/brioela-tools/18-search-web.md` lines 30–59.

---

## Provider routing (internal — not exposed to agent)

Agent specifies `search_type`. Brain maps to provider. Agent never sees provider name in input.

| search_type | Provider | API endpoint | Notes |
|---|---|---|---|
| `factual` | **Tavily** | `https://api.tavily.com/search` | `search_depth: 'basic'`; `include_answer: false` |
| `research` | **Exa** | `https://api.exa.ai/search` | `type: 'neural'` always |

### Secrets

| Secret | Provider |
|---|---|
| `TAVILY_API_KEY` | Tavily factual path |
| `EXA_API_KEY` | Exa research path |

Set via `wrangler secret put`. **Not** in `wrangler.jsonc` today.

### Provider decision (migration)

| Source | Provider | Status |
|---|---|---|
| **`implementable-specs/brioela-tools/18-search-web.md`** | Tavily + Exa | **Primary ship authority** |
| `_records/.../0007.web-tool.md` | Brave only (`BRAVE_SEARCH_API_KEY`) | **Obsolete implementation plan** — reject for build |
| `_features/18-brain-web-search/status.md` (stub) | “Brave/Tavily” | **Stale** — superseded by implementable spec |
| `backend/worker-configuration.d.ts` | Cloudflare `WebSearch` binding | **Not in any Brioela spec** — future option only (G18) |

**Ship Tavily + Exa per implementable spec.** Do not implement Brave path from ledger 0007 without a spec change.

---

## Response shape

```typescript
interface SearchWebResult {
  results: Array<{
    title:          string
    url:            string
    snippet:        string    // LLM-ready clean text — no HTML
    content?:       string    // only if include_full_content: true
    published_date?: string    // ISO date if available
  }>
  query:        string
  search_type:  'factual' | 'research'
  provider:     'tavily' | 'exa'
  result_count: number
}
```

Empty results: `{ results: [], result_count: 0, ... }` — **not** an error.

Provider responses are normalized to this shape before return (Tavily `content` → `snippet`; Exa `highlights[0]` or `text` slice → `snippet`).

---

## Rate limit

**5 calls per session** — session-scoped counter incremented on every successful API attempt (including empty results). When limit reached, return error **without** calling provider.

| Field | Value |
|---|---|
| Counter scope | Per active session build — fresh `{ count: 0 }` when **20** constructs tools |
| Limit | 5 |
| Error code | `session_web_search_limit_reached` |
| Message | Human-readable limit explanation |

**Authority:** ledger `0007.web-tool.md` lines 24–25, 75. **Not** in implementable spec 18 — absorbed from ledger as operational guard.

---

## Side effects (fire-and-forget)

Every successful provider call logs to `memory_event` via `ctx.waitUntil` — agent does not await.

### Correct production field mapping

Implementable spec 18 uses pseudocode field names (`eventType`, `content`, `createdAt`). **Production `memory_event` schema uses:**

| Spec pseudocode | Production column |
|---|---|
| `eventType` | `kind` |
| `content` (JSON string) | `payloadJson` |
| `createdAt` | `capturedAt` + `ingestedAt` |
| `sessionId` | `sessionId` |

```typescript
writeMemoryEvent(db, {
  id: createId(),
  userId,
  kind: 'web_search',
  payloadJson: JSON.stringify({
    query,
    search_type,
    provider,
    result_count: results.length,
    top_urls: results.slice(0, 3).map((r) => r.url),
  }),
  capturedAt: now,
  ingestedAt: now,
  source: 'search_web',
  sessionId: activeSessionId,
})
```

`web_search` is a new `kind` value — not in `01-memory-event.md` launch list; free-text `kind` allows it without migration.

### Failure logging (`agent_state`)

On `search_failed`, upsert diagnostic row:

| Key | `web_search.failure.{sessionId}` |
|---|---|
| Value JSON | `{ query, provider, error, ts }` |

Uses `agent_state` table (`key` PK, `value` JSON text, `userId`, `updatedAt`). Pattern aligns with `memory.write_failure.{session_id}` in `11-agent-state.md`.

**Ledger conflict:** `0007.web-tool.md` says executable has “no DB writes”. **Prefer implementable spec** observability + corrected schema mapping.

---

## Error cases

| Error | Cause | Agent receives |
|---|---|---|
| Validation error | Zod fail (query length, bad enum) | Zod field errors |
| `session_web_search_limit_reached` | 5 calls exhausted | `{ error, message, limit: 5, count }` |
| `web_search_unavailable` | Missing `TAVILY_API_KEY` or `EXA_API_KEY` for chosen path | `{ error, message: 'Web search is not configured' }` |
| `search_failed` | Network, rate limit, provider outage | `{ error, message, provider }` + `agent_state` write |

---

## Who can call it (`TOOL_PERMISSIONS`)

**Primary authority:** `implementable-specs/brioela-tools/18-search-web.md` lines 235–285.

| Caller (`SessionKind` or future kind) | Allowed | Reason |
|---|---|---|
| `chat` | ✓ | Core use case — factual/research mid-conversation |
| `cooking` | ✓ | Food safety, substitutions, technique during Brain `cooking` session |
| `product_scan` | ✓ (spec) | Ingredient lookup when not in user memory — **kind not in `sessionKindSchema` today** (**G12**) |
| `alarm` | ✗ | Restricted alarm tool set |
| `brain_maintenance` | ✗ | Internal data only |
| `behavior_pattern_detection` | ✗ | Internal events only |

### Obsolete ledger position

`0007.web-tool.md`: `search_web` only in `general` sessions; cooking denied; uses `general` not `chat`.

**Reject ledger permissions.** `general` is not a production `SessionKind` (see **16** G analysis). Modern enum: `chat`, `cooking`, `alarm`, `brain_maintenance`, `behavior_pattern_detection`.

### Feature 12 catalog note

**12** `spec.md` line 49 cites “`chat` sessions only per ledger 0007”. **Correct for migration:** chat + cooking per implementable spec; ledger chat-only note is stale.

---

## Split file layout

Per tool protocol (`build-guide/05-brain/02-tool-protocol.md`) and ledger 0007 complaints 007–010:

| File | Role |
|---|---|
| `_schemas/search.web.schema.ts` | Zod input |
| `_prompts/search.web.prompt.ts` | Tool description |
| `_executables/search.web.executable.ts` | Provider fetch + rate limit + side effects |
| `search.web.tool.ts` | Thin AI SDK `tool()` wrapper |

Folder name: **`_executables/`** (plural) — matches shipped alarm/memory tools, not build-guide’s `_executable/` singular typo.

Barrel exports: add to `_schemas/index.ts`, `_executables/index.ts`. Prompts may use direct import (alarm pattern G14).

---

## Registration in `getBrainTools`

```typescript
// New factory params for search_web:
searchWebTool(
  db,
  userId,
  activeSessionId,
  env,                        // TAVILY_API_KEY + EXA_API_KEY
  sessionWebSearchCounter,    // { count: number } — fresh per session
  waitUntil?,
)
```

Add `'search_web'` to `TOOL_PERMISSIONS` for `chat` and `cooking`. Defer `product_scan` until **24** adds session kind or scanner routes through `chat` with metadata.

**19** owns the full permission matrix; **18** owns the tool implementation + documents required permission rows.

---

## Safety and content policy

Implementable spec 18 does **not** define content safety filters, domain blocklists, or query sanitization beyond Zod length bounds.

| Topic | Spec says |
|---|---|
| Safety filters | Silent — rely on provider defaults |
| Caching | Silent — no cache layer specified |
| PII in queries | Silent — logged in `memory_event` payload |
| Citation rule | Ledger 0007: agent cites URL, does not fabricate sources — adopt as prompt guidance |

**G13–G15** track undefined safety/cache/PII policy.

---

## Architecture placement

```text
User message (chat or cooking session)          ← 20
        │
        ▼
getBrainTools(kind)                             ← 19 (+ 18 registration)
        │
        ├── search_web (if permitted)
        │       ├── rate limit check (5/session)
        │       ├── route search_type → Tavily | Exa
        │       ├── normalize results
        │       ├── waitUntil → memory_event kind web_search
        │       └── on failure → agent_state web_search.failure.*
        │
        ▼
Model cites URLs from tool output

Parallel (NOT this tool):
  MiraSession live cooking lookups              ← 29
  Recipe ingestion deep web search            ← 25
  Cloudflare WebSearch binding (undocumented)   ← future
```

---

## 18 vs neighbor boundaries

| In **18** (this feature) | In separate feature |
|---|---|
| `search_web` tool split layout | `getBrainTools` registry shell — **19** |
| Tavily + Exa HTTP executables | Live session `onMessage` / `chat()` — **20** |
| 5-call session rate limit | Session open/close — **11** |
| `memory_event` `web_search` kind log | `log_memory_event` tool — **05** |
| `agent_state` failure keys | `agent_state` schema — **04** |
| Permission rows for `search_web` | Full `TOOL_PERMISSIONS` matrix — **19** |
| Tool catalog boundary note | Agent inventory — **12** (cross-link only) |
| `product_scan` permission (spec) | Scanner session kind — **24** |
| Mira separate lookups | Cooking session DO — **29** |

---

## Obsolete / conflicting sources

| Source | Issue | Resolution |
|---|---|---|
| `0007.web-tool.md` | Brave API; `general` only; no cooking; no DB writes; simpler schema | **Reject** — Tavily/Exa + chat/cooking per implementable spec |
| `0000-ledger-index.md` line 45 | “Brave Search API, general session only” | Index summary stale |
| `18-search-web.md` pseudocode `memory_event` fields | Wrong column names vs production schema | Map to `kind` / `payloadJson` / `capturedAt` |
| `build-guide/05-brain/02-tool-protocol.md` | Lists 17 tools only — no `search_web` row | **19** extends registry; tool is #18 in `brioela-tools/00-index.md` |
| `15-brain-maintenance-and-behavior-patterns.md` TOOL_PERMISSIONS | Includes `product_scan` kind | Kind not in production `sessionKindSchema` |
| Cloudflare `WebSearch` in `worker-configuration.d.ts` | Discovery-only (URL + metadata, no snippets) | Different contract than Tavily/Exa — not drop-in |
| Recipe ingestion “deep web search” | **25** pipeline | Not `search_web` tool |
| Feature 12 catalog “chat only” | Cites ledger 0007 | Update to chat + cooking per implementable spec |

---

## Sources

- `implementable-specs/brioela-tools/18-search-web.md` — **primary**
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` (TOOL_PERMISSIONS)
- `implementable-specs/01-memory-event.md`
- `implementable-specs/11-agent-state.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0007.web-tool.md`
- `_records/implementation-ledger/0000-ledger-index.md`
- `_features/12-brain-sub-agents/spec.md` (catalog boundary)
- `_features/12-brain-sub-agents/draft/search.web.tool-boundary.gap.md`
- `_features/16-brain-session-tools/spec.md` (boundary)
- `_features/19-brain-tool-registry/status.md`
- `_features/20-brain-chat-runtime/status.md`
- `backend/src/agents/brain/_tools/get.brain.tools.ts` (production permissions — no search_web)
- `backend/wrangler.jsonc` (no search API secrets)
- `backend/worker-configuration.d.ts` (WebSearch types)
