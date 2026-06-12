# Status

open

**`search_web` not shipped.** No schema/prompt/executable/tool files; not in production `get.brain.tools.ts`; no `TAVILY_API_KEY` / `EXA_API_KEY` secrets. Provider: **Tavily (factual) + Exa (research)** per implementable spec — not Brave (ledger 0007 obsolete).

# Shipped in backend (partial — dependencies only)

- [x] `memory_event` table + `writeMemoryEvent` repository (**04** / **05**)
- [x] `agent_state` table (**04**)
- [x] `getBrainTools` registry shell with `SessionKind` enum (**19** partial)
- [ ] `_schemas/search.web.schema.ts`
- [ ] `_prompts/search.web.prompt.ts`
- [ ] `_executables/search.web.executable.ts`
- [ ] `search.web.tool.ts`
- [ ] `search_web` in `TOOL_PERMISSIONS` (`chat`, `cooking`)
- [ ] Session rate limit counter wiring (**20**)
- [ ] `TAVILY_API_KEY` secret
- [ ] `EXA_API_KEY` secret
- [ ] `memory_event` `web_search` kind logging
- [ ] `agent_state` `web_search.failure.*` writer
- [ ] `search.web.tool.test.ts`
- [ ] `product_scan` session kind + permission (**24**)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `searchWebSchema` | `rg searchWebSchema backend` — zero |
| G2 | No `searchWebExecutable` | `rg searchWeb backend/src/agents/brain` — zero |
| G3 | No `search.web.tool.ts` | File absent under `_tools/` |
| G4 | `get.brain.tools.ts` omits `search_web` | Lines 16–50 — no entry in `TOOL_PERMISSIONS` or `all` map |
| G5 | No `TAVILY_API_KEY` in worker env | `wrangler.jsonc` has DO only — no secrets documented |
| G6 | No `EXA_API_KEY` in worker env | Same |
| G7 | No 5-call session rate limit | Ledger 0007 specifies; no counter in production |
| G8 | No `search_web` tests | Ledger verification plan not implemented |
| G9 | **20** does not inject counter / env / `waitUntil` for web tool | Framework hardening open |
| G10 | `memory_event` side effect not wired | Implementable spec 18 — no executable |
| G11 | `agent_state` failure logging not wired | Spec 18 + `11-agent-state.md` pattern — no repo |
| G12 | `product_scan` in spec permissions but not in `sessionKindSchema` | `get.brain.tools.ts` line 13 — five kinds only |
| G13 | No content safety / domain filter spec | Implementable spec silent |
| G14 | No query result caching spec | Implementable spec silent |
| G15 | PII in queries logged to `memory_event` — retention policy undefined | Spec logs `query` in payload |
| G16 | Implementable spec `memory_event` pseudocode uses wrong column names | `eventType`/`content` vs production `kind`/`payloadJson` |
| G17 | Ledger 0007 Brave provider conflicts with implementable Tavily/Exa | Two authorities — **prefer implementable spec** |
| G18 | Cloudflare `WebSearch` binding in worker types but no Brioela spec | `worker-configuration.d.ts` — discovery-only, no snippets |
| G19 | Feature **12** catalog says “chat only” (cites ledger) | `12/spec.md` line 49 — stale vs implementable spec |
| G20 | Build-guide tool table lists 17 tools — no row for #18 | `02-tool-protocol.md` — **19** extends |

# 18 vs neighbor boundaries

| In **18** (this feature) | In separate feature |
|---|---|
| `search_web` split tool + executables | `getBrainTools` registry — **19** |
| Tavily + Exa HTTP integration | Live `chat()` / `onMessage` — **20** |
| 5-call rate limit counter contract | Session construction — **20** |
| `web_search` memory_event kind | `log_memory_event` tool — **05** |
| Tool boundary catalog note | Agent inventory — **12** (not owner) |
| Mira separate web lookups | **29-cooking-session** |
| Recipe ingestion deep search | **25-recipe-ingestion** |
| `product_scan` permission (future) | **24-scanner** |
| Full `TOOL_PERMISSIONS` matrix | **19-brain-tool-registry** |

# Provider decision

| Authority | Provider | Ship? |
|---|---|---|
| **`implementable-specs/brioela-tools/18-search-web.md`** | Tavily (`factual`) + Exa (`research`) | **Yes** |
| `_records/.../0007.web-tool.md` | Brave Search API | **No** — obsolete ledger |
| Cloudflare `WebSearch` binding | Managed discovery (URL + metadata only) | **No** — not in spec; different response shape |

# Session permissions (resolved)

| Kind | `search_web` | Authority |
|---|---|---|
| `chat` | ✓ | Implementable spec 18 |
| `cooking` | ✓ | Implementable spec 18 + spec 15 |
| `product_scan` | ✓ (spec only) | Implementable spec 18 — kind not shipped |
| `alarm` | ✗ | Implementable spec 18 |
| `brain_maintenance` | ✗ | Implementable spec 18 |
| `behavior_pattern_detection` | ✗ | Implementable spec 18 |

**Obsolete:** ledger 0007 `general` only, cooking denied. `general` ≠ production `SessionKind`.

# Blocked by

- 04-brain-foundation (tables)
- 05-brain-memory-tools (`writeMemoryEvent`)
- 19-brain-tool-registry (registry shell — partial)
- 20-brain-chat-runtime (counter + env injection)

# Blocks

- 19-brain-tool-registry (full 18-tool catalog)
- 20-brain-chat-runtime (external factual queries in live sessions)

# Obsolete / conflicting sources

| Source | Issue |
|---|---|
| `brain/03-tool-protocol/implementation/0007.web-tool.md` | Brave API; `general` session; no DB writes; simpler schema — **superseded** |
| `0000-ledger-index.md` line 45 | “Brave Search API, general session only” — index stale |
| Stub `status.md` “Brave/Tavily” | Mixed providers — **superseded** by Tavily/Exa spec |
| `18-search-web.md` memory_event insert pseudocode | Wrong field names vs Drizzle schema |
| `12-brain-sub-agents/spec.md` “chat only” for search_web | Cites ledger — update to chat + cooking |
| Recipe ingestion “deep web search” | **25** job — not this tool |
| Cloudflare WebSearch binding | Platform option — not Brioela contract |

# Ambiguous / conflicting sources

1. **Provider:** Ledger Brave vs implementable Tavily/Exa — **ship Tavily/Exa** (G17).
2. **Session kinds:** Ledger `general`-only vs implementable chat+cooking+product_scan — **ship chat+cooking**; defer product_scan (G12).
3. **DB writes:** Ledger “no DB writes” vs spec memory_event + agent_state — **ship observability** (G10, G11).
4. **Rate limit:** Only in ledger — **absorb 5/session** into feature 18 (G7).
5. **Cloudflare Web Search:** Types exist; no snippets/full content — not drop-in for Tavily/Exa contract (G18).
6. **Mira cooking:** Separate lookup path per ledger + **12** catalog — do not route through Brain `search_web` during Mira live session (**29**).

# Sources

- `implementable-specs/brioela-tools/18-search-web.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/01-memory-event.md`
- `implementable-specs/11-agent-state.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `build-guide/19-recipe-ingestion/03-source-extraction.md` (deep web search — separate)
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0007.web-tool.md`
- `_records/implementation-ledger/0000-ledger-index.md`
- `_records/inventory/inventory.md`
- `_features/12-brain-sub-agents/spec.md`
- `_features/12-brain-sub-agents/draft/search.web.tool-boundary.gap.md`
- `_features/16-brain-session-tools/spec.md`
- `_features/19-brain-tool-registry/status.md`
- `_features/20-brain-chat-runtime/status.md`
- `backend/src/agents/brain/_tools/get.brain.tools.ts`
- `backend/wrangler.jsonc`
- `backend/worker-configuration.d.ts`

# Draft count

**9** files in `draft/` — full intended production snapshots for schema, prompt, executable, tool, permissions, failure repo, tests, boundary note, and wrangler secrets.
