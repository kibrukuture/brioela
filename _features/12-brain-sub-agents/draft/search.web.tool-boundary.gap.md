# Draft: search_web — cross-feature gap (NOT feature 12)

**Owning feature:** **18-brain-web-search**

**Shipped:** No. `search_web` is not in production `get.brain.tools.ts` or executables.

## What it is

A **Brain tool** (Tavily / Exa HTTP executable) — **not** an Agent DO. Invoked from Brain inline chat sessions; not spawned via `subAgent()`.

## Relationship to BrioelaBrain

| Aspect | Contract |
|---|---|
| Executor | Brain `_tools/_executables/search.web.executable.ts` (intended) |
| Session scope | **`chat` sessions only** per ledger `0007.web-tool.md` — not maintenance/background kinds |
| Rate limit | 5 calls per session (spec **18**) |
| Mira cooking | Mira may perform its own lookups during live cooking — separate from Brain `search_web` tool path (**29**) |

## Why listed in feature 12 inventory

Feature **12** docs catalog all agent-like runtimes so migration is not read as "three agents total." `search_web` is a tool boundary, not a sub-agent — owned entirely by **18**.

## Intended production path

```
backend/src/agents/brain/_tools/
├── _executables/search.web.executable.ts
├── search.web.tool.ts
└── get.brain.tools.ts          ← chat SessionKind includes search_web
```

## Sources read

- `implementable-specs/brioela-tools/18-search-web.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0007.web-tool.md`
- `_features/18-brain-web-search/status.md`
