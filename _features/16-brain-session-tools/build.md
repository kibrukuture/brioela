# Brain Session Tools — Build

Feature **16**. Production paths under `backend/src/agents/brain/`.

**Depends on:** **04** FTS migrations (shipped); **09** alarm repos (shipped); **05** memory repos (partial); **11** session repos + lifecycle (open); **15** optional overlap repos.

**Blocks:** **20** first-turn hydration; agent recall of distant session history.

---

## Shipped today

| Area | Status |
|---|---|
| `sessions` + `session_turns` schemas | ✓ (**04**) |
| `sessions_fts` + `sessions_fts_trigram` + sync triggers | ✓ migration `0001` |
| `session_turns_fts*` (not used by tool 17) | ✓ migration `0001` |
| FTS sync tests (`run.migrations.handler.test.ts`) | ✓ Latin + trigram paths |
| `scheduled_alarms` schema + read/write alarm repos | ✓ (**09**) |
| `user_memory` schema + `listUserMemories` / `readUserMemory` | ✓ (**05** partial) |
| `load.session.context.tool.ts` | ✗ |
| `search.session.history.tool.ts` | ✗ |
| Session tools schemas / prompts / executables | ✗ |
| `read.session.tools.repository.ts` | ✗ |
| `is.non.latin.query.helper.ts` | ✗ |
| Session tools in `getBrainTools` | ✗ |
| Session tools unit tests | ✗ |
| **11** `read.user.session.repository.ts` | ✗ (base reads blocked) |

**No session tool production code exists.** `rg load_session_context\|search_session_history backend/src/agents/brain` — zero matches.

---

## File manifest

### Tool entrypoints (16 core)

| File | Role |
|---|---|
| `_tools/load.session.context.tool.ts` | AI SDK `tool()` factory — `load_session_context` |
| `_tools/search.session.history.tool.ts` | AI SDK `tool()` factory — `search_session_history` |

### Schemas

| File | Role |
|---|---|
| `_tools/_schemas/load.session.context.schema.ts` | `loadSessionContextSchema` — Zod |
| `_tools/_schemas/search.session.history.schema.ts` | `searchSessionHistorySchema` — Zod |
| `_tools/_schemas/index.ts` | Export both (modify) |

### Prompts

| File | Role |
|---|---|
| `_tools/_prompts/load.session.context.prompt.ts` | Tool description string |
| `_tools/_prompts/search.session.history.prompt.ts` | Tool description string |
| `_tools/_prompts/index.ts` | Export both (modify) |

### Executables

| File | Role |
|---|---|
| `_tools/_executables/load.session.context.executable.ts` | Five read paths + response assembly |
| `_tools/_executables/search.session.history.executable.ts` | Script detect + FTS + join + filter |
| `_tools/_executables/index.ts` | Export both (modify) |

### Helpers

| File | Role |
|---|---|
| `_helpers/is.non.latin.query.helper.ts` | `isNonLatinQuery(query: string): boolean` |

### Repositories

| File | Functions |
|---|---|
| `_repositories/read.session.tools.repository.ts` | `readLastCompletedSessionForContext`, `readRecentCompletedSessionOutcomes`, `readLastAbandonedSession`, `listPendingAlarmsForSessionContext`, `listDistinctActiveMemoryNamespaces`, `searchSessionsOutcomeFts` |

May merge into **11** `read.user.session.repository.ts` when that ships — avoid duplicate `readLastCompletedSession` implementations.

Export from `_repositories/index.ts`.

### Registration

| File | Role |
|---|---|
| `_tools/get.brain.tools.ts` | Add tools to `all` map + `TOOL_PERMISSIONS` per spec |

### Tests

| File | Role |
|---|---|
| `_tools/session.tools.test.ts` | load + search + user isolation + FTS routing + empty history |

---

## Implementation contracts

### Split layout (ledger complaint 007)

Each tool: `_schemas/`, `_prompts/`, `_executables/`, `.tool.ts`. Read-only — no `createId()` insert paths.

### Imports

- Zod: `@brioela/shared/zod` only
- DB helpers: `@/database/drizzle/_database` — `getOne`, `and`, `eq`, `desc`, `asc`, `gte`, `isNotNull`, `ne`, `sql`
- Schemas: `@/agents/brain/_schemas`
- No banned lexicon variable names (`input`, `output`, `result`, `payload` as identifiers)

### `loadSessionContextExecutable`

```typescript
export async function loadSessionContextExecutable(
  db: BrainDatabase,
  userId: string,
  params: z.infer<typeof loadSessionContextSchema>,
): Promise<LoadSessionContextResponse>
```

Steps:

1. Validate `current_session_id` exists for `userId` (optional strict check — throw if foreign session id).
2. `readLastCompletedSessionForContext(db, userId, params.current_session_id)`
3. `readRecentCompletedSessionOutcomes(db, userId, params.current_session_id, params.limit_recent_sessions)`
4. `listPendingAlarmsForSessionContext(db, userId)`
5. `listDistinctActiveMemoryNamespaces(db, userId)`
6. `readLastAbandonedSession(db, userId, params.current_session_id)`
7. Map rows to snake_case JSON response per tool spec.

Parse `scheduled_alarms.payload` with `jsonValueSchema` or `JSON.parse` + validation.

### `searchSessionHistoryExecutable`

```typescript
export async function searchSessionHistoryExecutable(
  db: BrainDatabase,
  userId: string,
  params: z.infer<typeof searchSessionHistorySchema>,
): Promise<SearchSessionHistoryResponse>
```

Steps:

1. `const useTrigram = isNonLatinQuery(params.query)`
2. `const ftsTable = useTrigram ? 'sessions_fts_trigram' : 'sessions_fts'`
3. `safeQuery = params.query.replace(/["*^]/g, ' ').trim()`
4. `searchSessionsOutcomeFts(db, userId, ftsTable, safeQuery, params, fetchLimit = params.limit * 2)`
5. Return with `fts_table_used` field.

### `searchSessionsOutcomeFts` — raw SQL

Drizzle does not abstract FTS5 MATCH. Use `database.all()` with parameterized query:

```sql
SELECT s.id, s.session_type, s.outcome_summary, s.recipe_id, s.ended_at, s.model
FROM sessions s
INNER JOIN {ftsTable} f ON s.rowid = f.rowid
WHERE f.outcome_summary MATCH ?
  AND s.user_id = ?
  AND s.status = 'completed'
  AND s.outcome_summary IS NOT NULL
  -- optional session_type, since_timestamp
ORDER BY s.ended_at DESC
LIMIT ?
```

**Security:** `user_id` filter mandatory on every search.

### `getBrainTools` changes

```typescript
const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
  chat: [ ..., 'load_session_context', 'search_session_history' ],
  cooking: [ ..., 'load_session_context', 'search_session_history' ],
  alarm: [ ..., 'load_session_context' ],
  brain_maintenance: [ /* no session tools */ ],
  behavior_pattern_detection: [ /* no session tools */ ],
}

const all = {
  ...
  load_session_context: loadSessionContextTool(db, userId),
  search_session_history: searchSessionHistoryTool(db, userId),
}
```

---

## Acceptance criteria

1. `load.session.context.tool.ts` and `search.session.history.tool.ts` exist with split layout.
2. Schemas match implementable specs **16** / **17** field names and constraints.
3. `load_session_context` returns all five sections; empty history is valid (null/[]).
4. `search_session_history` queries `sessions_fts` or `sessions_fts_trigram` — **not** `session_turns_fts`.
5. Search results filter `status = 'completed'` and `user_id`.
6. Search re-orders by `ended_at DESC` after FTS rank fetch.
7. `fts_table_used` included in search response.
8. `isNonLatinQuery` matches spec Unicode ranges.
9. `getBrainTools`: chat + cooking get both tools; alarm gets load only.
10. Session tools exported in schema/prompt/executable barrel indexes.
11. `read.session.tools.repository.ts` exported from `_repositories/index.ts`.
12. `session.tools.test.ts` covers:
    - load with 0/1/3 prior completed sessions
    - load excludes `current_session_id`
    - search Latin + trigram routing
    - search `session_type` + `since_timestamp` filters
    - user A cannot see user B sessions in search
    - empty search returns `result_count: 0` not error
13. `bun run verify` passes after implementation.

Do **not** mark **16** `shipped` until tools register in `getBrainTools`, executables pass tests, and **11** can supply completed session rows (or tests seed sessions directly).

---

## Verification commands

```sh
cd backend && bun run brain:typecheck
cd backend && bunx vitest run src/agents/brain/_tools/session.tools.test.ts
cd backend && bunx vitest run src/agents/brain/_migrations/run.migrations.handler.test.ts
cd backend && rg 'load_session_context|search_session_history|loadSessionContext|searchSessionHistory' src/agents/brain
```

---

## Blocked by

| Feature | Blocker |
|---|---|
| **04** | FTS migrations — ✓ shipped |
| **09** | Alarm list for pending — repos exist; list-all-pending helper may be new |
| **05** | Distinct namespace query — pattern exists in `listUserMemories` |
| **11** | Completed `sessions` rows with `outcome_summary` — lifecycle open |
| **13** | Compression JSON in `outcome_summary` — affects searchability (**G15**) |

## Blocks

- **20-brain-chat-runtime** — first-turn `load_session_context` orchestration
- **17-brain-vectorize** — complementary semantic path (not replacement)

---

## Draft folder

See `status.md` for gap list and draft count (**12** gap snapshots).

---

## Sources

- `_features/16-brain-session-tools/spec.md`
- `implementable-specs/brioela-tools/16-load-session-context.md`
- `implementable-specs/brioela-tools/17-search-session-history.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0006.session-tools.md` (obsolete FTS target)
- `build-guide/05-brain/02-tool-protocol.md`
- `backend/src/agents/brain/_tools/get.brain.tools.ts`
- `backend/src/agents/brain/drizzle/0001_add_fts_and_triggers.sql`
