# Table: sessions

## Why This Table Exists

Every interaction the user has with the agent — a chat, a cooking session, a voice session, a background alarm job — is a session. `sessions` is one row per session. It stores everything ABOUT the session: type, lifecycle, token cost, compression chain, and outcome summary.

`sessions` does NOT store conversation turns. Those are in `session_turns`. `sessions` is the envelope. `session_turns` is the content inside.

## Session Types

Not all sessions are user-initiated conversations. There are four types:

**`chat`** — regular text or voice conversation. User opens the app and talks to the agent.

**`cooking`** — a live cooking session. Spawned by the `MiraSession` DO. Has a recipe, has WebSocket, has voice. Can run 2+ hours. Produces a transcript summary and writes facts back to `user_memory` when it ends.

**`alarm`** — the `BrioelaBrain` DO woke up from a DO alarm and ran an autonomous job. No user present. The agent read an event, did something (sent a notification, pre-loaded travel data, ran illness detective), and wrote results. This is still a session — it consumed tokens, it produced outcomes, it must be tracked.

**`background`** — a Brain maintenance pass, a skill deduplication job, a behavior pattern detection run. Similar to alarm but not necessarily triggered by a DO alarm — could be triggered by an Upstash Workflow step.

## Decision: Both DOs Write to the Same Table

`BrioelaBrain` and `MiraSession` both write sessions here. `session_type` distinguishes them. The `MiraSession` DO writes its session row when the cooking session starts and updates it when it ends. The Brain DO reads that row when `MiraSession` calls back with its summary. One table, one place to look for all session history.

## Decision: parent_session_id for Compression Chains

A 2-hour grandma cooking session generates thousands of turns in `session_turns`. Without compression, the active session grows unbounded — query performance collapses and context window fills. When a session gets too long, a new session is created with a compressed summary of the old one. `parent_session_id` points to the session it compressed from. This keeps the active session short while the full history chain is preserved by following `parent_session_id` links.

This is the same pattern Hermes uses (`parent_session_id` in their sessions table). It is the correct solution to long-running sessions.

## Decision: Token and Cost Tracking Per Session

Without token tracking, there is no way to:
- Monitor per-user token spend
- Detect a runaway session burning money
- Understand cache efficiency (cache_read_tokens tells you how often the prompt cache is hitting)
- Build future per-user billing

Hermes tracks all of this per session. We must too. These columns go on the session row because cost is per-session, not per-turn.

## Decision: outcome_summary is agent-written at session end

When a session ends (cooking finished, user closed app, alarm completed), the agent writes a short summary: what happened, what facts were extracted to `user_memory`, what constraints were proposed, what skills were created or updated. This is what gets read by the next session to understand what the previous session produced. It is also what `search_session_history` searches via FTS5 when the user asks "what did we cook last time."

## CREATE TABLE

```sql
CREATE TABLE sessions (
  id                TEXT PRIMARY KEY,   -- UUID v4
  user_id           TEXT NOT NULL,      -- owner — self-describing for export and Data Studio
  session_type      TEXT NOT NULL,      -- 'chat' | 'cooking' | 'alarm' | 'background'
  parent_session_id TEXT,               -- UUID of the session this was compressed from — NULL if not a compression
  recipe_id         TEXT,               -- which recipe this cooking session was for — NULL for non-cooking sessions
  alarm_type        TEXT,               -- which alarm triggered this session — NULL for non-alarm sessions
  status            TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'completed' | 'compressed' | 'abandoned'
  outcome_summary   TEXT,               -- agent-written summary at session end — NULL while active
  model             TEXT NOT NULL,      -- which model was used: 'claude-sonnet-4-6', 'gemini-live', etc.
  input_tokens      INTEGER NOT NULL DEFAULT 0,
  output_tokens     INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,   -- prompt cache hits — measures cache efficiency
  cache_write_tokens INTEGER NOT NULL DEFAULT 0,  -- prompt cache writes
  estimated_cost_usd REAL,             -- estimated USD cost for this session
  turn_count        INTEGER NOT NULL DEFAULT 0,   -- number of turns in this session
  skills_created    INTEGER NOT NULL DEFAULT 0,   -- how many new skills the agent created in this session
  constraints_proposed INTEGER NOT NULL DEFAULT 0, -- how many new constraints were proposed
  memory_writes     INTEGER NOT NULL DEFAULT 0,   -- how many user_memory writes happened
  started_at        INTEGER NOT NULL,  -- unix timestamp ms
  ended_at          INTEGER,           -- unix timestamp ms — NULL while active
  end_reason        TEXT               -- 'completed' | 'timeout' | 'user_closed' | 'compressed' | 'error' | NULL while active
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const sessions = sqliteTable('sessions', {
  id:                  text('id').primaryKey(),
  userId:              text('user_id').notNull(),
  sessionType:         text('session_type').notNull(),      // 'chat' | 'cooking' | 'alarm' | 'background'
  parentSessionId:     text('parent_session_id'),           // compression chain
  recipeId:            text('recipe_id'),
  alarmType:           text('alarm_type'),
  status:              text('status').notNull().default('active'),
  outcomeSummary:      text('outcome_summary'),             // written at session end
  model:               text('model').notNull(),
  inputTokens:         integer('input_tokens').notNull().default(0),
  outputTokens:        integer('output_tokens').notNull().default(0),
  cacheReadTokens:     integer('cache_read_tokens').notNull().default(0),
  cacheWriteTokens:    integer('cache_write_tokens').notNull().default(0),
  estimatedCostUsd:    real('estimated_cost_usd'),
  turnCount:           integer('turn_count').notNull().default(0),
  skillsCreated:       integer('skills_created').notNull().default(0),
  constraintsProposed: integer('constraints_proposed').notNull().default(0),
  memoryWrites:        integer('memory_writes').notNull().default(0),
  startedAt:           integer('started_at').notNull(),
  endedAt:             integer('ended_at'),
  endReason:           text('end_reason'),
})
```

## Column Decisions

**`id` — UUID**
Sessions are referenced from `session_turns` (foreign key), `memory_event` (session_id), `constraints` (surfaced in which session), `scheduled_alarms` (which session spawned this alarm). UUID is the stable cross-table reference.

**`session_type` — four types, free text, Zod-enforced**
Determines how the session is processed at end time. A `cooking` session end triggers transcript summarization and fact extraction. An `alarm` session end triggers outcome writing back to the event log. A `background` session end updates Brain maintenance metadata. The type drives the end-of-session logic.

**`parent_session_id` — nullable, compression chain**
NULL for normal sessions. Set when this session was created to compress an older one. Following the chain: current session → `parent_session_id` → grandparent → ... gives the full history. The chain is the archive.

**`recipe_id` — nullable**
Only set for `cooking` sessions. Links this session to the specific recipe being cooked. Enables "what sessions have we cooked this recipe in" queries and pre-loading recipe notes from prior sessions.

**`alarm_type` — nullable**
Only set for `alarm` sessions. Values match the alarm types in `scheduled_alarms`: `sickness_followup`, `travel_preload`, `recall_check`, `behavior_pattern_detection`, `brain_maintenance_run`. Tells the DO what to do when it wakes up.

**`status` — four states**
- `active`: session is running right now
- `completed`: ended normally, outcome_summary written
- `compressed`: this session was archived into a new compressed session — it is the old one in a compression chain
- `abandoned`: session ended without a proper close (app crash, connection drop, timeout)

**`outcome_summary` — NULL while active, agent-written at end**
A short paragraph the agent writes when the session closes. What happened, what was learned, what was written to memory. This is what `search_session_history` FTS5-searches when the user asks about past sessions. Empty sessions (alarm ran, nothing notable) get a minimal summary. Rich cooking sessions get a full summary including recipe notes, techniques observed, grandma-style details captured.

**`model` — which model ran this session**
`claude-sonnet-4-6` for chat and alarm sessions. `gemini-live` for voice cooking sessions. Knowing the model is essential for cost calculation and for understanding performance differences between session types.

**`input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens`**
Accumulated across all turns in the session. Updated at session end (or periodically for long sessions). `cache_read_tokens` reveals prompt cache efficiency — if cache_read_tokens is low relative to input_tokens, the system prompt ordering is not stable enough (see optimization notes in 00-overview).

**`estimated_cost_usd` — nullable**
Calculated at session end from token counts using current model pricing. NULL while session is active. Used for per-user spend monitoring.

**`turn_count`, `skills_created`, `constraints_proposed`, `memory_writes`**
Session-level activity counters. A session with 200 turns, 0 skills created, 0 constraints proposed, and 3 memory writes is a normal chat. A session with 20 turns and 2 skills created is a high-value learning session. These aggregate signals are useful for understanding session quality without querying `session_turns`.

**`started_at` vs `ended_at` vs `end_reason`**
`ended_at` is NULL while active — the query `WHERE ended_at IS NULL` finds all currently running sessions. `end_reason` records why — a session that ended with `end_reason = 'error'` is a debugging target.

## Indexes

```sql
CREATE INDEX idx_sessions_type_status    ON sessions (session_type, status, started_at DESC);
CREATE INDEX idx_sessions_parent         ON sessions (parent_session_id) WHERE parent_session_id IS NOT NULL;
CREATE INDEX idx_sessions_recipe         ON sessions (recipe_id) WHERE recipe_id IS NOT NULL;
CREATE INDEX idx_sessions_started        ON sessions (started_at DESC);
CREATE INDEX idx_sessions_active         ON sessions (status) WHERE status = 'active';
```

**Why these indexes:**
- `(session_type, status, started_at)` — "show me all completed cooking sessions, newest first"
- `(parent_session_id)` partial — follow compression chains: "what session did this compress from"
- `(recipe_id)` partial — "all sessions where we cooked this recipe" — recipe history queries
- `(started_at DESC)` — chronological session list for the user's session history
- `(status)` partial on active — fast check for currently running sessions (should be 0 or 1 at any time)

## Write Rules

- Row inserted at session start with `status = 'active'`, `ended_at = NULL`.
- `turn_count`, `skills_created`, `constraints_proposed`, `memory_writes` incremented during the session as events occur — fire and forget, never awaited.
- At session end: `status`, `ended_at`, `end_reason`, `outcome_summary`, all token counts, `estimated_cost_usd` written in a single update.
- Compression: old session's `status` set to `'compressed'`. New session inserted with `parent_session_id` pointing to old session's `id`.
- `MiraSession` DO writes and owns its own session row. When the cooking session ends, it updates its row and calls the `BrioelaBrain` DO with the outcome summary.

## Read Rules

- Read by `load_session_context()` to load the previous session's `outcome_summary` for continuity.
- Read by `search_session_history` FTS5 search path — `outcome_summary` is indexed in `sessions_fts` and `sessions_fts_trigram`.
- Read by token monitoring to check per-user spend.
- Read by recipe history queries: all sessions for a given `recipe_id`.
- Never bulk-loaded into prompts — only the most recent session's `outcome_summary` is injected.

## FTS5 Virtual Tables for outcome_summary

`sessions.outcome_summary` is the agent-written summary of what happened each session. It is the primary target when the user asks "what did we cook last time" or "when did I last feel sick after eating out." Two FTS5 virtual tables cover it — one per tokenizer.

### sessions_fts

```sql
CREATE VIRTUAL TABLE sessions_fts USING fts5(
  outcome_summary,
  content='sessions',
  content_rowid='rowid',
  tokenize='unicode61'
);
```

Default unicode61 tokenizer. Works for English and all Latin-script languages. Backed by the `sessions` real table — `sessions_fts` is a search interface, not a storage table. Truth stays in `sessions.outcome_summary`.

Triggers to keep it in sync:

```sql
CREATE TRIGGER sessions_fts_ai AFTER INSERT ON sessions BEGIN
  INSERT INTO sessions_fts(rowid, outcome_summary) VALUES (new.rowid, new.outcome_summary);
END;

CREATE TRIGGER sessions_fts_au AFTER UPDATE ON sessions BEGIN
  INSERT INTO sessions_fts(sessions_fts, rowid, outcome_summary) VALUES ('delete', old.rowid, old.outcome_summary);
  INSERT INTO sessions_fts(rowid, outcome_summary) VALUES (new.rowid, new.outcome_summary);
END;

CREATE TRIGGER sessions_fts_ad AFTER DELETE ON sessions BEGIN
  INSERT INTO sessions_fts(sessions_fts, rowid, outcome_summary) VALUES ('delete', old.rowid, old.outcome_summary);
END;
```

### sessions_fts_trigram

```sql
CREATE VIRTUAL TABLE sessions_fts_trigram USING fts5(
  outcome_summary,
  content='sessions',
  content_rowid='rowid',
  tokenize='trigram'
);
```

Trigram tokenizer. Splits text into overlapping 3-character sequences — no word boundaries needed. Required for Arabic, Amharic, Japanese, and any script where the default tokenizer produces nothing. Same trigger pattern as `sessions_fts`.

### Search Path

When `search_session_history` runs:
- Latin-script query → search `sessions_fts` with `MATCH`
- Non-Latin query (detected by script range) → search `sessions_fts_trigram` with `MATCH`
- Results are session rowids → join back to `sessions` to get the full row

## What Is NOT Stored Here

- Individual conversation turns → `session_turns`
- Raw domain events → `memory_event`
- Structured user facts → `user_memory`
- Scheduled future work → `scheduled_alarms`
