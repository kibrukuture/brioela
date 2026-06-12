# Brain Web Search — Build

Feature **18**. Production paths under `backend/src/agents/brain/_tools/` for `search_web`; wrangler secrets; permission rows in `get.brain.tools.ts`.

**Depends on:** **04** Brain DO + `memory_event` / `agent_state` tables; **05** `writeMemoryEvent` repository; **19** `getBrainTools` registry (partial — extend); **20** session construction (counter + `waitUntil` injection).

**Blocks:** **19** full tool catalog completion; **20** external factual queries in live chat/cooking.

---

## Shipped today

| Area | Status |
|---|---|
| `memory_event` table + `writeMemoryEvent` repo | ✓ (**04** / **05**) |
| `agent_state` table | ✓ (**04**) |
| `search_web` schema / prompt / executable / tool | ✗ |
| `get.brain.tools.ts` `search_web` entry | ✗ |
| `TAVILY_API_KEY` / `EXA_API_KEY` secrets | ✗ |
| Session web-search rate limit counter wiring | ✗ |
| `search_web` unit tests | ✗ |
| Brave / Cloudflare Web Search integration | ✗ (not ship path) |

**No web search production code exists.** `rg search_web\|searchWeb\|search\.web backend/src/agents/brain` — zero matches in `_tools/`.

---

## File manifest

### Tool entrypoint

| File | Role |
|---|---|
| `_tools/search.web.tool.ts` | AI SDK `tool()` factory — `search_web` |

### Schema

| File | Role |
|---|---|
| `_tools/_schemas/search.web.schema.ts` | `searchWebSchema` + inferred types |
| `_tools/_schemas/index.ts` | Export `searchWebSchema` (modify) |

### Prompt

| File | Role |
|---|---|
| `_tools/_prompts/search.web.prompt.ts` | Tool description — when to call, cite URLs, check internal tools first |
| `_tools/_prompts/index.ts` | Optional export (alarm pattern allows direct import) |

### Executable

| File | Role |
|---|---|
| `_tools/_executables/search.web.executable.ts` | Rate limit, Tavily/Exa fetch, normalize, side effects |
| `_tools/_executables/index.ts` | Export `searchWebExecutable` (modify) |

### Repository (optional thin helper)

| File | Role |
|---|---|
| `_repositories/log.web.search.failure.repository.ts` | Upsert `agent_state` key `web_search.failure.{sessionId}` |

Alternatively inline drizzle in executable — repository preferred for testability.

### Registration

| File | Change |
|---|---|
| `_tools/get.brain.tools.ts` | Add `search_web` to `chat` + `cooking` permissions; register factory with env + counter + `waitUntil` |
| `_tools/index.ts` | Optional re-export `searchWebTool` |

### Worker secrets (not in wrangler.jsonc)

| Secret | Role |
|---|---|
| `TAVILY_API_KEY` | Factual search path |
| `EXA_API_KEY` | Research search path |

```bash
bunx wrangler secret put TAVILY_API_KEY
bunx wrangler secret put EXA_API_KEY
```

### Tests

| File | Role |
|---|---|
| `_tools/search.web.tool.test.ts` | Mock fetch; rate limit; permission matrix; error shapes |

Ledger 0007 suggests adding to `memory.tool.test.ts` — prefer dedicated file to keep web mocks isolated.

---

## Executable contract (`searchWebExecutable`)

1. **Validate** — Zod already at tool boundary; executable receives typed params.
2. **Rate limit** — if `sessionWebSearchCounter.count >= 5` → `{ error: 'session_web_search_limit_reached', limit: 5, count }` without HTTP.
3. **Key check** — missing key for routed provider → `web_search_unavailable`.
4. **HTTP** — POST to Tavily or Exa per `search_type`; map to common result shape.
5. **Increment counter** — on attempted provider call (after key check, before return).
6. **Side effect** — `waitUntil` → `writeMemoryEvent` with `kind: 'web_search'`.
7. **Failure** — catch → `search_failed` + `logWebSearchFailure` to `agent_state`.
8. **Return** — `SearchWebResult` JSON (including empty `results`).

---

## `getBrainTools` changes

```typescript
// TOOL_PERMISSIONS additions:
chat: [ ..., 'search_web' ],
cooking: [ ..., 'search_web' ],

// all map:
search_web: searchWebTool(
  db,
  userId,
  activeSessionId,
  env,
  sessionWebSearchCounter,
  waitUntil,
),
```

**20** must pass:

- `env` with both API keys (may be empty strings — executable returns `web_search_unavailable`)
- Fresh `sessionWebSearchCounter = { count: 0 }` per session tool build
- `waitUntil` from Brain DO context (same as `read_user_memory`)

---

## Account setup checklist

```bash
# 1. Obtain API keys from Tavily and Exa dashboards
# 2. Set secrets per environment
bunx wrangler secret put TAVILY_API_KEY
bunx wrangler secret put EXA_API_KEY

# 3. Verify (manual — no wrangler subcommand for Tavily/Exa)
# Run search.web.tool.test.ts with mocked fetch in CI
```

**Do not** add `BRAVE_SEARCH_API_KEY` unless spec changes.

---

## Acceptance criteria

### Tool behavior

- [ ] `search_web` registered in `getBrainTools` for `chat` and `cooking`
- [ ] `search_web` **absent** for `alarm`, `brain_maintenance`, `behavior_pattern_detection`
- [ ] `search_type: 'factual'` routes to Tavily with `Authorization: Bearer`
- [ ] `search_type: 'research'` routes to Exa with `x-api-key`
- [ ] Response normalizes to `{ results[], query, search_type, provider, result_count }`
- [ ] `include_full_content: true` populates optional `content` per result
- [ ] Empty provider results return `result_count: 0` — not an error
- [ ] 6th call in same session returns `session_web_search_limit_reached` without HTTP

### Observability

- [ ] Successful call writes `memory_event` row `kind: 'web_search'` via `waitUntil`
- [ ] Provider failure writes `agent_state` `web_search.failure.{sessionId}`

### Errors

- [ ] Missing API key → `web_search_unavailable`
- [ ] Provider non-2xx / network → `search_failed` with `provider` field
- [ ] Query &lt; 3 or &gt; 300 chars → Zod validation error at tool boundary

### Tests (`bun run brain:test` or project equivalent)

- [ ] Mock Tavily — assert normalized shape
- [ ] Mock Exa — assert normalized shape
- [ ] Rate limit at 5 — no fetch on 6th
- [ ] `getBrainTools('alarm')` omits `search_web`
- [ ] `getBrainTools('chat')` includes `search_web` when keys present

### Boundaries (manual review)

- [ ] No Brave API code unless spec amended
- [ ] Mira cooking path does not import `searchWebExecutable` (**29** owns separate lookups)
- [ ] Recipe ingestion jobs do not call `search_web` tool (**25**)

---

## Verification commands

```bash
rg 'search_web|searchWeb|search\.web' backend/src/agents/brain/_tools
bun run brain:test   # after tests added
bun run verify
```

---

## 18 vs build-order neighbors

| Step | Feature | Relationship |
|---|---|---|
| Tool registry shell | **19** | Registers `search_web` in `all` map |
| Session handler | **20** | Injects counter + `waitUntil` + env |
| Agent catalog | **12** | Cross-link only — not implementation owner |
| Scanner `product_scan` kind | **24** | Future permission row — not blocking core ship |
| Mira lookups | **29** | Parallel path — do not conflate |
