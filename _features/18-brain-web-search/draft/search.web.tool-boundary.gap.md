# Draft: search_web — cross-feature boundary (feature 18 owner)

**Owning feature:** **18-brain-web-search**

**Shipped:** No. `search_web` is not in production `get.brain.tools.ts` or executables.

**Related:** `_features/12-brain-sub-agents/draft/search.web.tool-boundary.gap.md` — catalog cross-link; **18** owns implementation detail.

---

## What it is

A **Brain tool** (Tavily / Exa HTTP executable) — **not** an Agent DO. Invoked from Brain inline `chat` and `cooking` sessions; not spawned via `subAgent()`.

---

## Relationship to BrioelaBrain

| Aspect | Contract |
|---|---|
| Executor | `backend/src/agents/brain/_tools/_executables/search.web.executable.ts` |
| Session scope | **`chat` + `cooking`** per implementable spec 18 — **not** `alarm`, `brain_maintenance`, `behavior_pattern_detection` |
| Future scope | `product_scan` per spec 18 — requires **24** to add `SessionKind` |
| Rate limit | **5 calls per session** (ledger 0007 — absorbed into 18) |
| Provider | **Tavily** (`factual`) + **Exa** (`research`) — **not** Brave |
| Mira cooking | Mira performs **separate** lookups during live cooking — **29** — not this tool |
| Recipe ingestion | “Deep public web search” in share-sheet pipeline — **25** — not this tool |
| Bela shopper | Gemini in BelaOrderAgent — **42** — not `search_web` |

---

## Why listed in feature 12 inventory

Feature **12** catalogs all agent-like runtimes so migration is not read as "three agents total." `search_web` is a tool boundary, not a sub-agent — owned entirely by **18**.

**Stale in 12:** catalog line "chat sessions only per ledger 0007" — update to chat + cooking when **12** next edited.

---

## 18 vs 12 / 19 / 20

| Feature | Owns |
|---|---|
| **18** | Tool files, Tavily/Exa executables, rate limit, memory_event log, agent_state failures |
| **12** | Catalog entry only — `draft/search.web.tool-boundary.gap.md` cross-link |
| **19** | `getBrainTools` shell, full `TOOL_PERMISSIONS` matrix, barrel exports |
| **20** | Injects `env`, `sessionWebSearchCounter`, `waitUntil`; runs `streamText` with tools |
| **29** | MiraSession separate web lookup path |
| **25** | Recipe ingestion deep search job |

---

## Intended production path

```text
backend/src/agents/brain/_tools/
├── _schemas/search.web.schema.ts
├── _prompts/search.web.prompt.ts
├── _executables/search.web.executable.ts
├── search.web.tool.ts
└── get.brain.tools.ts          ← chat + cooking include search_web

backend/src/agents/brain/_repositories/
└── log.web.search.failure.repository.ts

wrangler secrets:
  TAVILY_API_KEY
  EXA_API_KEY
```

---

## Sources read

- `implementable-specs/brioela-tools/18-search-web.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0007.web-tool.md`
- `_features/12-brain-sub-agents/spec.md`
- `_features/19-brain-tool-registry/status.md`
- `_features/20-brain-chat-runtime/status.md`
- `backend/src/agents/brain/_tools/get.brain.tools.ts`
