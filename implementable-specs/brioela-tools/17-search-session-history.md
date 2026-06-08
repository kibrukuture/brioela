# Tool: search_session_history

## Purpose

`search_session_history` searches past session outcome summaries by keyword or phrase, using the FTS5 virtual tables (`sessions_fts` for Latin-script and `sessions_fts_trigram` for non-Latin). The agent calls this when the user asks about past sessions in a way that cannot be answered from the already-loaded recent context.

The regular context load (`load_session_context`) gives the agent the last 3 completed sessions. That is enough for continuity. This tool is for when the user asks about something further back: "what did we cook with grandma three weeks ago?", "when did I last feel sick after eating out?", "that Ethiopian stew we made in April — what was the spice order?"

## When to Call It

Call `search_session_history` when:
- The user asks about a past event the agent cannot answer from the current session context
- The relevant session is not in the 3 most recent (loaded by `load_session_context`)
- The user references a time period, dish, or event that needs a keyword scan across history

Do NOT call `search_session_history` when:
- The answer is already in the session context from `load_session_context` — do not make an unnecessary read
- The user is asking about something general like "do I like spicy food" — that is in `user_memory` or `user_personality`, not session history
- The user asks about a specific recipe's details — `view_user_recipe` is the right path

## Input Schema

```typescript
import { z } from 'zod'

export const SearchSessionHistorySchema = z.object({
  query: z.string().min(1).max(500),
  // The search query. Matched against outcome_summary content via FTS5 MATCH.
  // Can be a phrase, a dish name, a symptom, an event.
  // The tool detects script and routes to the correct FTS5 virtual table automatically.
  // Latin: "doro wat grandma spice", "felt sick dinner"
  // Non-Latin: Arabic dish name, Amharic phrase — routed to trigram table

  session_type: z.enum(['chat', 'cooking', 'alarm', 'background']).optional(),
  // Filter by session type. Omit to search all types.
  // Common use: session_type: 'cooking' to find only cooking sessions.

  limit: z.number().int().min(1).max(10).default(5),
  // Max number of results to return. Default 5. Never exceed 10 — the agent
  // should not be loading 10 session summaries into context at once.

  since_timestamp: z.number().int().positive().optional(),
  // Unix timestamp ms. Only search sessions that ended after this time.
  // Narrows the search to a time window when the user references a specific period.
  // Example: "what did we cook this month" → since_timestamp = start of month
})
```

## Script Detection Logic

Before querying, the tool detects whether the query contains non-Latin script characters:

```typescript
function isNonLatin(query: string): boolean {
  // Match Arabic, Amharic (Ethiopic), CJK, and other non-Latin Unicode blocks
  return /[؀-ۿሀ-፿一-鿿぀-ゟ゠-ヿ]/.test(query)
}

const useTrigram = isNonLatin(input.query)
const ftsTable = useTrigram ? 'sessions_fts_trigram' : 'sessions_fts'
```

The agent does not need to know which table is used. The routing is automatic.

## What It Reads

### FTS5 Search

```typescript
// Build the FTS5 MATCH query
// Escape special FTS5 characters in the user's query
const safeQuery = input.query.replace(/["*^]/g, ' ').trim()

// Run the FTS5 search — get matching rowids
const matchingRowids = db.all(
  sql`SELECT rowid FROM ${sql.raw(ftsTable)}
      WHERE ${sql.raw(ftsTable)} MATCH ${safeQuery}
      ORDER BY rank
      LIMIT ${input.limit * 2}`  // fetch extra to allow post-filter
)
```

### Join Back to sessions for Full Context

```typescript
const rowids = matchingRowids.map(r => r.rowid)

let query = db.select({
  id:             sessions.id,
  sessionType:    sessions.sessionType,
  outcomeSummary: sessions.outcomeSummary,
  recipeId:       sessions.recipeId,
  endedAt:        sessions.endedAt,
  model:          sessions.model,
})
.from(sessions)
.where(
  and(
    inArray(sessions.rowid, rowids),
    eq(sessions.status, 'completed'),          // only completed sessions have outcome_summary
    isNotNull(sessions.outcomeSummary),
    ...(input.session_type
      ? [eq(sessions.sessionType, input.session_type)]
      : []),
    ...(input.since_timestamp
      ? [gte(sessions.endedAt, input.since_timestamp)]
      : []),
  )
)
.orderBy(desc(sessions.endedAt))
.limit(input.limit)
.all()
```

FTS5 `ORDER BY rank` puts best matches first. After joining back and filtering, results are re-ordered by `ended_at DESC` (newest first) — recency matters more than FTS rank for session history questions.

## What It Returns

```json
{
  "query": "doro wat grandma spice",
  "results": [
    {
      "id": "session-uuid-1",
      "session_type": "cooking",
      "outcome_summary": "Cooked doro wat with grandma. She showed the 3-stage spice layering method — berbere goes in at step 2, not step 1. Captured in recipe update.",
      "recipe_id": "recipe-uuid",
      "ended_at": 1748390400000
    },
    {
      "id": "session-uuid-2",
      "session_type": "cooking",
      "outcome_summary": "Second attempt at doro wat. Used the new spice order from last session. Grandma confirmed it was correct this time.",
      "recipe_id": "recipe-uuid",
      "ended_at": 1747785600000
    }
  ],
  "result_count": 2,
  "fts_table_used": "sessions_fts"
}
```

`fts_table_used` is included for debuggability — if search returns unexpected results, the agent knows which tokenizer ran.

If no results: `results: []`, `result_count: 0`. Not an error. The agent tells the user nothing was found and offers to help them think through what session it might have been in (approximate date, what else happened, who was there).

## FTS5 Query Limitations the Agent Should Know

- FTS5 `MATCH` requires at least one non-trivial term. Single-character queries will return nothing.
- FTS5 does not do fuzzy matching — "doro" matches "doro", not "doro wat" unless the document contains "doro wat". Phrase search: use double quotes in the query: `"doro wat"`.
- Trigram search (`sessions_fts_trigram`) works differently — it matches any substring of 3+ characters. More flexible for non-Latin but may return more false positives.
- If the user's query returns no results, the agent should try a simpler query — drop adjectives, search by core ingredient or dish name only.

## Side Effects

None. Pure reads. No writes, no counters incremented.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | Query empty, limit out of range | Zod error with failing field |
| FTS5 syntax error | Query has unbalanced quotes or malformed operators | Error message — agent should retry with simplified query |
| Read failure | SQLite error (rare) | Error message |

## Who Can Call It

- **Agent** — during any active session, when the user asks about past sessions not in recent context
- **NOT the Brain maintenance** — reads sessions directly for its maintenance pass
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Loading recent sessions for session continuity → `load_session_context`
- Loading full turn transcripts from a session → read `session_turns` directly with the session_id
- Searching within a single session's turns → read `session_turns` with `session_turns_fts`
- Searching user facts and preferences → `read_user_memory`
- Meaning-based semantic search across sessions → Cloudflare Vectorize query via brioela-sessions index (separate path, not this tool)
