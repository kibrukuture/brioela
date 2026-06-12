# Brain Session Tools — Spec

Feature **16**. AI-callable **session-facing read tools** inside the per-user `BrioelaBrain` Durable Object: `load_session_context` and `search_session_history`. Includes Zod schemas, executables, split tool layout, session read repositories, FTS5 query paths over `sessions.outcome_summary`, script detection for Latin vs trigram tokenizers, and `getBrainTools` permission wiring.

**Not in this feature:** session open/close lifecycle (**11-brain-sessions-lifecycle**); static system prompt block assembly (**15-brain-system-prompt**); session compression (**13-brain-session-compression**); Vectorize semantic search (**17-brain-vectorize**); turn-level FTS over `session_turns` (no dedicated tool — direct repo read if needed); web search (**18-brain-web-search**); live chat turn loop that invokes tools (**20-brain-chat-runtime**); Mira cooking DO runtime (**29-cooking-session**).

---

## Purpose

Sessions accumulate `outcome_summary` text at close and mid-compression. The agent needs two bounded read paths:

1. **`load_session_context`** — called **once at session start** to hydrate continuity: last completed session, recent outcome summaries, pending alarms, active memory namespaces, and abandoned-session warning. Bridges sessions without replaying full transcripts.

2. **`search_session_history`** — called **mid-session on demand** when the user asks about events not in the already-loaded recent context. Keyword search across historical `outcome_summary` via FTS5 (`sessions_fts` / `sessions_fts_trigram`).

Both tools are **read-only**. No SQLite writes. No side effects.

Without these tools, the agent either starts cold (missing continuity) or must guess from the single Block 9 `outcome_summary` in the system prompt (**15**) — insufficient when the user references something older than the last session or needs keyword scan across history.

---

## Tools discovered (complete list)

Exhaustive grep of `implementable-specs/brioela-tools/`, `build-guide/05-brain/02-tool-protocol.md`, ledger `0006.session-tools.md`, and `brioela-tools/00-index.md`:

| # | Tool name | Spec file | In feature **16**? |
|---|---|---|---|
| 16 | `load_session_context` | `16-load-session-context.md` | **Yes** |
| 17 | `search_session_history` | `17-search-session-history.md` | **Yes** |

**No other session tools exist** in the implementable tool catalog. Turn-level recall (`session_turns_fts`) is documented in `08-session-turns.md` as a **direct read path**, not an AI tool. Semantic session search is **Vectorize** (**17**), explicitly **not** `search_session_history` per tool spec line 178.

`search_web` (**18**) is external web lookup — out of scope.

---

## Architecture placement

```text
openSession()                                    ← 11
        │
        ├── buildSystemPrompt()                  ← 15 (Blocks 7–9 overlap tool reads)
        │
        ▼
First model turn
        │
        ├── load_session_context (once)          ← 16 (THIS FEATURE)
        │       ├── read last completed session
        │       ├── read recent completed outcomes
        │       ├── list pending alarms
        │       ├── list active memory namespaces
        │       └── flag recent abandoned session
        │
        ▼
Mid-session user question about distant past
        │
        ├── search_session_history (on demand)   ← 16 (THIS FEATURE)
        │       ├── isNonLatin(query) → pick FTS table
        │       ├── sessions_fts MATCH
        │       └── join sessions → filter completed + user_id
        │
        ▼
Optional: Vectorize semantic query              ← 17 (separate path)
```

**Prefix-cache note (`00-overview.md`):** `load_session_context` is called once; its result is held in agent context for the session lifetime. It does **not** mutate the static system prompt prefix assembled by **15** — the agent incorporates tool output into reasoning and responses. **15** and **16** overlap on data (pending alarms, namespaces, last outcome) but serve different assembly paths: builder injects at open for cache stability; tool provides richer multi-session hydration at first turn.

---

## FTS infrastructure (shipped — **04**)

Migration `backend/src/agents/brain/drizzle/0001_add_fts_and_triggers.sql` creates:

| Virtual table | Tokenizer | Indexed column | Source table |
|---|---|---|---|
| `sessions_fts` | `unicode61` | `outcome_summary` | `sessions` |
| `sessions_fts_trigram` | `trigram` | `outcome_summary` | `sessions` |
| `session_turns_fts` | `unicode61` | `content` | `session_turns` |
| `session_turns_fts_trigram` | `trigram` | `content` | `session_turns` |

**Feature 16 uses `sessions_fts*` only** for `search_session_history`. Turn FTS exists for future direct-read / hybrid paths — **not** exposed as tool **17**.

Sync triggers: AFTER INSERT/UPDATE/DELETE on `sessions` keep FTS rows aligned. Verified in `run.migrations.handler.test.ts` (Latin `doro` match on `sessions_fts`; trigram on `session_turns_fts_trigram`).

---

## Tool 1 — `load_session_context`

**Spec source:** `implementable-specs/brioela-tools/16-load-session-context.md`

### Purpose

Assembles previous session outcome and carry-over context at the start of a new session. Bridge between sessions — without it, every session starts with no memory of what just happened.

### When to call

**Call exactly once:**
- At the start of every new `chat` session
- At the start of every new `cooking` session (before loading recipe)
- At the start of every `alarm` session spawned by the DO alarm handler

**Do NOT call:**
- Mid-session — context already loaded
- More than once per session
- In `background` sessions (Brain maintenance / behavior pattern) — those read state directly

### Input schema

```typescript
import { z } from '@brioela/shared/zod'

export const loadSessionContextSchema = z.object({
  current_session_id: z.uuid(),
  // Exclude current session from "previous session" queries.

  limit_recent_sessions: z.number().int().min(1).max(5).default(3),
  // Default 3 — enough continuity without overwhelming context.
  // Increase to 5 for alarm sessions needing deeper history.
  // Never exceed 5 — use search_session_history for deeper history.
})
```

**`current_session_id`:** Required. The session row just created by `openSession` (**11**). Tool excludes this id from all prior-session queries.

**`limit_recent_sessions`:** Default **3**. Max **5**. Spec does not define alarm-specific auto-bump — caller (agent or **20** orchestration) may pass `5` for alarm sessions.

### Read paths (bounded, ordered)

All reads scoped to `user_id` from tool factory closure. No cross-user leakage.

#### 1. Most recent completed session (`last_session`)

Single row: `status = 'completed'`, `ended_at IS NOT NULL`, `id ≠ current_session_id`, `ORDER BY ended_at DESC LIMIT 1`.

Columns returned: `id`, `session_type`, `outcome_summary`, `recipe_id`, `ended_at`, `end_reason`, `model`.

**Most important read** — immediate continuity.

**Excludes:** `compressed`, `abandoned`, `active` rows.

#### 2. Recent session summaries (`recent_sessions`)

Up to `limit_recent_sessions` rows: `status = 'completed'`, `outcome_summary IS NOT NULL`, `id ≠ current_session_id`, `ORDER BY ended_at DESC`.

Columns: `id`, `session_type`, `outcome_summary`, `ended_at`.

**Outcome summary only** — never turn transcripts. Full turns: direct `session_turns` read (no tool).

`last_session` may duplicate the newest entry in `recent_sessions` — spec allows this; agent uses `last_session` for immediate continuity and `recent_sessions` for broader window.

#### 3. Pending alarms (`pending_alarms`)

From `scheduled_alarms`: `status = 'pending'`, `ORDER BY scheduled_at ASC`.

Columns: `id`, `alarm_type`, `scheduled_at`, `payload` (parsed JSON object in response).

Agent surfaces upcoming reminders. **Includes all pending types** — spec does not exclude `session_watchdog`. **15** Block 7 excludes `session_watchdog` from prompt formatting; **16** tool spec does not — document as overlap conflict (see ambiguous sources).

#### 4. Active memory namespaces (`memory_namespaces`)

`SELECT DISTINCT namespace FROM user_memory WHERE is_active = true ORDER BY namespace ASC`.

Only active namespaces. Deactivated-only namespaces omitted.

Cheap query — at most 40 strings per user namespace cap.

#### 5. Last abandoned session warning (`last_abandoned_session`)

Single row: `status = 'abandoned'`, `id ≠ current_session_id`, `ORDER BY started_at DESC LIMIT 1`.

Columns: `id`, `ended_at`, `session_type`.

If `ended_at` within **24 hours** of now, agent should acknowledge unexpected end. **24h window is in tool spec only** — not in **15**.

### Output shape

```json
{
  "last_session": { "id", "session_type", "outcome_summary", "recipe_id", "ended_at", "end_reason", "model" } | null,
  "recent_sessions": [ { "id", "session_type", "outcome_summary", "ended_at" } ],
  "pending_alarms": [ { "id", "alarm_type", "scheduled_at", "payload" } ],
  "last_abandoned_session": { "id", "ended_at", "session_type" } | null,
  "memory_namespaces": ["diet", "health.medications", ...]
}
```

**First-ever session:** `last_session: null`, `recent_sessions: []` — valid response, not an error.

### Agent behavior after response

Per tool spec:

1. Read `last_session.outcome_summary` — incorporate into context or open with acknowledgment
2. Read `pending_alarms` — surface relevant upcoming alarms
3. If `last_abandoned_session` recent (24h) — acknowledge unexpected end
4. Hold `memory_namespaces` for session — check before every `write_user_memory`
5. Do **not** load `session_turns` for previous session unless user/tool requires it

### Side effects

None. Pure reads.

### Error cases

| Error | Cause | Agent receives |
|---|---|---|
| Validation error | Invalid UUID, limit out of range | Zod error |
| Read failure | SQLite error | Error message |

No `found: false` pattern — empty prior history is valid success.

### Who can call

| Caller | Allowed |
|---|---|
| Agent in `chat` | Yes — once at start |
| Agent in `cooking` | Yes — once at start |
| Agent in `alarm` | Yes — once at start |
| Agent in `background` / maintenance | **No** — reads directly |
| Device SDK | **No** |

### What is NOT this tool's job

- Full turn transcripts → `session_turns` direct read
- Keyword search across history → `search_session_history`
- Memory, skills, constraints, personality → system prompt (**15**)
- Recipe details → `view_user_recipe`

---

## Tool 2 — `search_session_history`

**Spec source:** `implementable-specs/brioela-tools/17-search-session-history.md`

### Purpose

Keyword/phrase search over past session `outcome_summary` via FTS5. For when the user asks about events not answerable from `load_session_context`'s last 3 completed sessions.

Examples from spec: "what did we cook with grandma three weeks ago?", "when did I last feel sick after eating out?"

### When to call

**Call when:**
- User asks about a past event not in current session context
- Relevant session not in the 3 most recent (from `load_session_context`)
- User references time period, dish, or event needing keyword scan

**Do NOT call when:**
- Answer already in loaded session context
- Question is about general preferences → `read_user_memory` / personality
- Question is about a specific recipe's details → `view_user_recipe`

### Input schema

```typescript
import { z } from '@brioela/shared/zod'

export const searchSessionHistorySchema = z.object({
  query: z.string().min(1).max(500),
  session_type: z.enum(['chat', 'cooking', 'alarm', 'background']).optional(),
  limit: z.number().int().min(1).max(10).default(5),
  since_timestamp: z.number().int().positive().optional(),
})
```

### Script detection

Before FTS query, detect non-Latin script in query string:

```typescript
// Arabic, Ethiopic, CJK ranges per tool spec
/[؀-ۿሀ-፿一-鿿぀-ゟ゠-ヿ]/.test(query)
```

| Script | FTS table |
|---|---|
| Latin (default) | `sessions_fts` |
| Non-Latin | `sessions_fts_trigram` |

Agent does not choose table — tool routes automatically. Response includes `fts_table_used` for debug.

### FTS query path

1. Escape FTS5 special chars in user query: `query.replace(/["*^]/g, ' ').trim()`
2. `SELECT rowid FROM {ftsTable} WHERE {ftsTable} MATCH ? ORDER BY rank LIMIT limit * 2` — over-fetch for post-filter
3. Join `sessions` on `rowid IN (...)`
4. Filter:
   - `user_id = ctx.userId` (**mandatory** — FTS alone has no user scope)
   - `status = 'completed'`
   - `outcome_summary IS NOT NULL`
   - Optional `session_type` filter
   - Optional `ended_at >= since_timestamp`
5. `ORDER BY ended_at DESC` — **recency wins over FTS rank** after join
6. `LIMIT input.limit`

**Compressed sessions excluded:** `status = 'compressed'` rows fail the `completed` filter. Their `outcome_summary` holds four-field JSON from compression (**13**) — not prose summaries searchable the same way. Product decision documented as **G15** in `status.md`.

**Abandoned sessions:** `buildAbandonedSummary` text may be indexed but `status = 'abandoned'` also excluded by `completed` filter.

### Output shape

```json
{
  "query": "doro wat grandma spice",
  "results": [
    {
      "id": "session-uuid",
      "session_type": "cooking",
      "outcome_summary": "...",
      "recipe_id": "recipe-uuid",
      "ended_at": 1748390400000
    }
  ],
  "result_count": 2,
  "fts_table_used": "sessions_fts"
}
```

Empty results: `results: []`, `result_count: 0` — not an error.

### FTS5 limitations (agent-facing)

Per tool spec:

- MATCH needs non-trivial terms — single-char queries return nothing
- No fuzzy matching — phrase search uses double quotes
- Trigram: 3+ char substrings; more false positives
- On no results: simplify query (drop adjectives, core dish/ingredient only)

### Side effects

None.

### Error cases

| Error | Cause | Agent receives |
|---|---|---|
| Validation error | Empty query, limit out of range | Zod error |
| FTS5 syntax error | Unbalanced quotes, bad operators | Error message — retry simplified query |
| Read failure | SQLite error | Error message |

### Who can call

| Caller | Allowed |
|---|---|
| Agent in `chat` | Yes — mid-session |
| Agent in `cooking` | Yes — mid-session |
| Agent in `alarm` | Spec says "any active session" — no user present; **implementation: omit from TOOL_PERMISSIONS** |
| Brain maintenance | **No** |
| Device SDK | **No** |

### What is NOT this tool's job

- Recent session continuity → `load_session_context`
- Full turn transcripts → `session_turns` by `session_id`
- Turn-level keyword search → `session_turns_fts` direct read
- User facts → `read_user_memory`
- Meaning-based semantic search → Vectorize (**17**) — tool spec line 178

---

## Session read repositories

**Target:** `backend/src/agents/brain/_repositories/read.session.tools.repository.ts` (or extend **11** `read.user.session.repository.ts` when shipped).

Functions owned by **16** (may share with **11**/**15**):

| Function | Used by |
|---|---|
| `readLastCompletedSessionForContext` | `load_session_context` — `last_session` |
| `readRecentCompletedSessionOutcomes` | `load_session_context` — `recent_sessions` |
| `readLastAbandonedSession` | `load_session_context` — warning |
| `listPendingAlarmsForSessionContext` | `load_session_context` — all pending |
| `listDistinctActiveMemoryNamespaces` | `load_session_context` — overlaps **15** G11 |
| `searchSessionsOutcomeFts` | `search_session_history` — FTS + join |

**11** may own base `readUserSession`, `readLastCompletedSession` — **16** adds tool-specific variants with exclude-current-session and FTS raw SQL.

**User isolation:** Every join back to `sessions` must filter `user_id`. FTS virtual tables have no `user_id` column.

---

## Tool file layout (split pattern)

Per `build-guide/05-brain/02-tool-protocol.md` and ledger complaint 007:

```
_tools/
  load.session.context.tool.ts
  _schemas/load.session.context.schema.ts
  _prompts/load.session.context.prompt.ts
  _executables/load.session.context.executable.ts
  search.session.history.tool.ts
  _schemas/search.session.history.schema.ts
  _prompts/search.session.history.prompt.ts
  _executables/search.session.history.executable.ts
_helpers/
  is.non.latin.query.helper.ts
```

Barrel `index.ts` in `_schemas`, `_prompts`, `_executables` — export new modules.

Factory signatures:

```typescript
export const loadSessionContextTool = (
  db: BrainDatabase,
  userId: string,
) => tool({ ... })

export const searchSessionHistoryTool = (
  db: BrainDatabase,
  userId: string,
) => tool({ ... })
```

`load_session_context` needs `current_session_id` in schema — **20** passes `activeSessionId` from `getBrainTools` closure or agent supplies from session state.

---

## `getBrainTools` permissions

**Current shipped state:** Neither session tool registered. `TOOL_PERMISSIONS` has no session entries.

**Canonical permissions (prefer implementable tool specs over ledger 0006):**

| `SessionKind` | `load_session_context` | `search_session_history` |
|---|---|---|
| `chat` | ✓ | ✓ |
| `cooking` | ✓ | ✓ |
| `alarm` | ✓ | ✗ (no user queries; load only at start) |
| `brain_maintenance` | ✗ | ✗ |
| `behavior_pattern_detection` | ✗ | ✗ |

**Conflicts resolved:**

| Source | Says | Resolution |
|---|---|---|
| Ledger `0006` | `general` gets both; `cooking` gets neither; maintenance gets load only | **Reject** — `general` is not a `SessionKind`; cooking must get both per spec **16** |
| `02-tool-protocol.md` | Both chat, cooking only | **Accept** for search; extend load to `alarm` per spec **16** |
| Spec **17** | "any active session" | **chat + cooking** for search; alarm omitted in permissions |

`getBrainTools` already accepts `activeSessionId` — use for defaulting or validating `current_session_id` if orchestration injects it.

---

## Feature boundaries

| Feature | Scope | Overlap with **16** |
|---|---|---|
| **11** | `openSession`, `closeSession`, watchdog, `outcome_summary` write at close | **16** reads outcomes; needs **11** repos + completed rows |
| **13** | Compression → `status: compressed`, JSON in `outcome_summary` | **16** search/load filter `completed` only — compressed invisible (**G15**) |
| **15** | `buildSystemPrompt` Blocks 7–9 | Same alarm/namespace/last-outcome data; builder at open, tool at first turn |
| **17** | Vectorize embed + semantic query | Separate from FTS tool **17**; `18-vectorize.md` mentions semantic path in tool — **reject for 16** |
| **04** | FTS migrations shipped | **16** consumes `sessions_fts*` |
| **09** | Alarm repos | Pending alarm list for load tool |
| **05** | Memory namespace distinct query | Shared with load tool + **15** Block 8 |
| **20** | Invokes tools in turn loop | Calls `load_session_context` once after open |

### `load_session_context` vs **15** system prompt

| Data | **15** builder | **16** tool |
|---|---|---|
| Last outcome | Block 9 — single `completed` row | `last_session` + up to 5 `recent_sessions` |
| Pending alarms | Block 7 — excludes `session_watchdog` | All `pending` rows per tool spec |
| Memory namespaces | Block 8 — chat/cooking only | Always returned |
| Abandoned warning | Not in builder | `last_abandoned_session` + 24h rule |
| When loaded | At `openSession` — prefix cache | Once at first turn — agent context |

Both valid per **15** status G overlap note. Agent should not redundantly call load if orchestration already injected equivalent context — product policy for **20**.

### `search_session_history` vs turn FTS

`08-session-turns.md` documents `session_turns_fts` for "when did I mention I was feeling sick" — turn-level recall. **No tool** in catalog. **16** searches session-level summaries only. Turn-level search is a future direct-read or separate tool — out of **16** scope.

### Compressed session visibility

| Path | Includes `compressed` rows? |
|---|---|
| `load_session_context` recent/last | **No** — `status = 'completed'` only |
| `search_session_history` | **No** — `status = 'completed'` only |
| **13** continuation block | **Yes** — parent JSON summary in prompt |
| **15** Block 9 | **No** — `completed` only per **15** build contract |
| Chain traversal `getFullSessionChain` | **Yes** — **13** read helper |

To search compressed mid-session summaries: extend tool filter or add product decision — tracked **G15**.

---

## Naming drift (historical)

| Issue | Resolution |
|---|---|
| Ledger `read.session.repository.ts` | Prefer `read.session.tools.repository.ts` or extend **11** `read.user.session.repository.ts` |
| Build-guide `load-session-context.tool.ts` (kebab) | Shipped pattern: `load.session.context.tool.ts` (dots) |
| Ledger `searchSessionTurnsFts` on `session_turns_fts` | **Reject** — implementable spec **17** uses `sessions_fts` |
| Ledger `found: false` for unknown session | **Reject** — tool spec **16** uses null/empty arrays |
| Variable name `input` in ledger samples | Banned lexicon — use `params` / destructured fields |
| `turn_index` in ledger SQL | Shipped column is `turn_number` |

---

## Obsolete ledger

| Ledger | Issue |
|---|---|
| `brain/03-tool-protocol/implementation/0006.session-tools.md` | Wrong: load by session ID; search `session_turns` FTS; `general` session kind; `found: false`; maintenance gets load — **superseded by this feature + implementable specs 16/17** |

Still useful for: split file layout complaint 007, `getOne`/`getReturned` import path, test file location hint.

---

## Ambiguous / conflicting sources

1. **FTS target table:** `02-tool-protocol.md` + ledger **0006** say `session_turns` FTS; **`17-search-session-history.md`** + **`07-sessions.md`** say `sessions_fts` on `outcome_summary`. **Prefer implementable tool spec 17.**
2. **Vectorize in search tool:** `build-guide/06-brain-memory/03-vectorize.md` + `18-vectorize.md` describe semantic path inside `search_session_history`; tool spec **17** line 178 says Vectorize is separate. **16** implements FTS only; semantic path is **17**.
3. **Pending alarms in load vs builder:** Tool includes all pending; **15** excludes `session_watchdog` in Block 7. **Implement both as specified** — document divergence; **20** may dedupe for agent.
4. **Compressed sessions in search:** Tool filters `completed` only — compressed summaries excluded (**G15**).
5. **Cooking session tool access:** Ledger denies cooking both tools; spec **16** requires cooking at start. **Prefer spec 16.**
6. **`00-overview.md` block 6:** Bundles load_session_context output as static prefix item — implies injection at open. Tool spec says agent calls tool. **Both paths coexist** — **15** static blocks + **16** optional richer load.
7. **`load_session_context` for alarm:** Spec requires at start; `02-tool-protocol.md` omits alarm. **Prefer spec 16** — alarm gets load only.
8. **user_id on FTS queries:** Spec join pseudocode omits explicit `user_id` filter; production **must** filter — security requirement (**G18**).

---

## Sources

- `implementable-specs/brioela-tools/16-load-session-context.md` (**PRIMARY** tool 1)
- `implementable-specs/brioela-tools/17-search-session-history.md` (**PRIMARY** tool 2)
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/07-sessions.md` (FTS on `outcome_summary`, read rules)
- `implementable-specs/08-session-turns.md` (turn FTS — not tool 17)
- `implementable-specs/17-session-lifecycle.md` (compression/abandoned — affects searchable rows)
- `implementable-specs/00-overview.md` (prefix cache + load once)
- `implementable-specs/18-vectorize.md` (semantic path — **17** not **16**)
- `implementable-specs/02-user-memory.md` (namespace catalog)
- `implementable-specs/10-scheduled-alarms.md` (pending alarm rows)
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/06-brain-memory/03-vectorize.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0006.session-tools.md` (**obsolete**)
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/13-brain-session-compression/spec.md`
- `_features/15-brain-system-prompt/spec.md`
- `backend/src/agents/brain/drizzle/0001_add_fts_and_triggers.sql` (shipped)
- `backend/src/agents/brain/_migrations/run.migrations.handler.test.ts` (FTS verification)
- `backend/src/agents/brain/_tools/get.brain.tools.ts` (permissions gap)
- `backend/src/agents/brain/_schemas/session.schema.ts` (shipped)
