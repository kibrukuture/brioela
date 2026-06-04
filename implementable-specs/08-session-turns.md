# Table: session_turns (+ session_turns_fts + session_turns_fts_trigram)

## Why This Table Exists

`sessions` is the envelope. `session_turns` is the content inside — one row per conversation turn. Every message the user sends, every response the agent gives, every tool call and tool result is a turn row. This is the raw transcript.

Without `session_turns`, there is no conversation history, no turn-level token tracking, no ability to reconstruct what was said in a session, and no text for FTS5 to index.

## Decision: session_turns is separate from sessions

`sessions` holds metadata about a session — type, cost, outcome, status. `session_turns` holds the actual content of the session. If turns were stored in `sessions` as a JSON blob, the session row would grow unbounded during a 2-hour cooking session and every metadata read would drag the full transcript along. Separate tables, separate concerns, separate access patterns.

## Decision: tool calls and tool results are turns

A tool call (`skill_view`, `propose_constraint`, `memory_write`) is part of the conversation. It consumes tokens. It produces a result. The result is part of context. Storing tool calls and results as turn rows gives a complete picture of what the agent actually did during a session — not just what it said.

## Decision: turn_number is an ordered integer, not derived from rowid

`rowid` is an internal SQLite detail — it is not stable across compression chains and does not communicate ordering intent. `turn_number` is explicit: turn 1, turn 2, turn 3. Monotonically increasing within a session. Compression creates a new session starting from turn 1 — the old session's turns are preserved under the old `session_id`.

## Decision: content is stored as-is, not summarized

Turns are the ground truth. Summarization happens at the session level (`sessions.outcome_summary`), not at the turn level. A turn row with summarized content is no longer a turn — it is a derivative. The real content must be preserved for compression chains and audit.

## CREATE TABLE

```sql
CREATE TABLE session_turns (
  id            TEXT PRIMARY KEY,    -- UUID v4
  session_id    TEXT NOT NULL,       -- which session this turn belongs to
  user_id       TEXT NOT NULL,       -- owner — self-describing for export
  turn_number   INTEGER NOT NULL,    -- ordered position within the session, starting at 1
  role          TEXT NOT NULL,       -- 'user' | 'assistant' | 'tool_call' | 'tool_result'
  content       TEXT NOT NULL,       -- full text of this turn
  tool_name     TEXT,                -- set when role = 'tool_call' — which tool was called
  tool_input    TEXT,                -- JSON — tool arguments, set when role = 'tool_call'
  tool_result   TEXT,                -- set when role = 'tool_result' — what the tool returned
  input_tokens  INTEGER NOT NULL DEFAULT 0,   -- tokens consumed by this turn
  output_tokens INTEGER NOT NULL DEFAULT 0,   -- tokens produced by this turn
  created_at    INTEGER NOT NULL     -- unix timestamp ms
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const sessionTurns = sqliteTable('session_turns', {
  id:          text('id').primaryKey(),
  sessionId:   text('session_id').notNull(),
  userId:      text('user_id').notNull(),
  turnNumber:  integer('turn_number').notNull(),
  role:        text('role').notNull(),         // 'user' | 'assistant' | 'tool_call' | 'tool_result'
  content:     text('content').notNull(),
  toolName:    text('tool_name'),
  toolInput:   text('tool_input'),             // JSON string
  toolResult:  text('tool_result'),
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  createdAt:   integer('created_at').notNull(),
})
```

## Column Decisions

**`id` — UUID**
Turns are referenced by the FTS5 virtual tables via rowid. UUID is the stable external identity for referencing turns from logs or debug tooling.

**`session_id` — the envelope reference**
Every turn belongs to exactly one session. This is the primary join key. When a session is compressed, its `session_id` is preserved in all its turns — the old turns do not get moved or re-parented.

**`user_id` — kept**
Rows must be self-describing outside the DO. Same reason as every other table.

**`turn_number` — explicit ordering**
Not derived from `rowid` or `created_at`. Explicit, monotonic, stable. Starts at 1 per session. When loading context for a prompt, turns are loaded `ORDER BY turn_number ASC` — deterministic order is required for Anthropic prompt cache stability. If ordering is non-deterministic, the cache never hits.

**`role` — four values, free text, Zod-enforced**
- `user` — the user's message
- `assistant` — the agent's response
- `tool_call` — the agent invoked a tool
- `tool_result` — the tool returned a result

Tool calls and results are first-class turns. They consume tokens and are part of context.

**`content` — always populated**
For `user` and `assistant` turns: the message text. For `tool_call` turns: a human-readable description of what was called (e.g. "Called skill_view('cooking-coach')"). For `tool_result` turns: the result text. `content` is always present — it is what FTS5 indexes.

**`tool_name`, `tool_input`, `tool_result` — nullable, set only for tool turns**
`tool_name` and `tool_input` are set when `role = 'tool_call'`. `tool_result` is set when `role = 'tool_result'`. NULL for `user` and `assistant` turns. `tool_input` is stored as a JSON string — the raw arguments passed to the tool.

**`input_tokens`, `output_tokens` — per-turn token counts**
Session-level totals in `sessions` are accumulated from these. Per-turn tracking enables debugging: which turn in the session consumed the most tokens? A single assistant turn with 4000 output tokens is a signal the agent over-responded.

**`created_at` — unix timestamp ms**
Not used for ordering (that is `turn_number`). Used for time-based queries: "what did we talk about this morning" or debugging when a specific turn happened.

## Indexes

```sql
CREATE INDEX idx_session_turns_session   ON session_turns (session_id, turn_number ASC);
CREATE INDEX idx_session_turns_user      ON session_turns (user_id, created_at DESC);
```

**Why these indexes:**
- `(session_id, turn_number ASC)` — primary access pattern: load all turns for a session in order. Used every time a session resumes.
- `(user_id, created_at DESC)` — data export and audit: find all turns for a user ordered by recency.

## Write Rules

- One row inserted per turn as it occurs during an active session.
- Written by the agent's turn execution path only — no other code writes here.
- `turn_number` is set by incrementing a counter held in `agent_state` for the session, never by querying MAX(turn_number) — avoids a read-before-write race.
- Never updated after insert. A turn is immutable once written.
- Never deleted. Compression does not delete old session turns — it creates a new session. Old turns stay under the old `session_id` permanently.

## Read Rules

- Loaded `ORDER BY turn_number ASC` when resuming an active session or reconstructing context.
- For long sessions: only the last N turns are loaded into context. N is determined by available context window budget minus system prompt size.
- Read by compression logic to summarize the session before creating a compressed successor.
- Never loaded in full for old sessions — only `sessions.outcome_summary` is used for past session recall.

---

## FTS5 Virtual Tables for session_turns

Turn content is what gets searched when the user asks "when did I mention I was feeling sick" or "find the session where we talked about berbere." Two FTS5 virtual tables cover `session_turns.content` — one per tokenizer.

### session_turns_fts

```sql
CREATE VIRTUAL TABLE session_turns_fts USING fts5(
  content,
  content='session_turns',
  content_rowid='rowid',
  tokenize='unicode61'
);
```

Default unicode61 tokenizer. English and all Latin-script languages. Backed by `session_turns` — virtual, no storage, no truth. The real content stays in `session_turns.content`.

Triggers to keep it in sync:

```sql
CREATE TRIGGER session_turns_fts_ai AFTER INSERT ON session_turns BEGIN
  INSERT INTO session_turns_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER session_turns_fts_au AFTER UPDATE ON session_turns BEGIN
  INSERT INTO session_turns_fts(session_turns_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
  INSERT INTO session_turns_fts(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER session_turns_fts_ad AFTER DELETE ON session_turns BEGIN
  INSERT INTO session_turns_fts(session_turns_fts, rowid, content) VALUES ('delete', old.rowid, old.content);
END;
```

### session_turns_fts_trigram

```sql
CREATE VIRTUAL TABLE session_turns_fts_trigram USING fts5(
  content,
  content='session_turns',
  content_rowid='rowid',
  tokenize='trigram'
);
```

Trigram tokenizer. Splits every string into overlapping 3-character sequences. No word boundary assumption. Required for Arabic, Amharic, Japanese, Chinese, and any script the default tokenizer cannot handle. Same trigger pattern as `session_turns_fts`.

### Search Path

When the agent runs a turn-level recall query:
- Latin-script query → `session_turns_fts MATCH 'keyword'`
- Non-Latin query (detected by Unicode script range of the query string) → `session_turns_fts_trigram MATCH 'keyword'`
- Results are rowids → join to `session_turns` to get the full turn row and `session_id`
- Then join to `sessions` to get session context

For hybrid search (FTS5 + Vectorize): run FTS5 first (zero latency), then Vectorize (5–20ms), merge by session_id, deduplicate, rank by combined relevance score.

## What Is NOT Stored Here

- Session metadata (type, cost, status, outcome) → `sessions`
- Session outcome_summary search → `sessions_fts`, `sessions_fts_trigram` (in `07-sessions.md`)
- Raw domain events → `memory_event`
- Structured user facts → `user_memory`
