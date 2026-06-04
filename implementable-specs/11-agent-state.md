# Table: agent_state

## Why This Table Exists

A Cloudflare Durable Object can be evicted by Cloudflare at any time and restarted on the next request. When it restarts, all in-memory state is gone. The DO reads everything it needs from SQLite. `agent_state` is the DO's operational memory — metadata about how the DO itself is running.

This is NOT user data. User facts go in `user_memory`. Personality traits go in `user_personality`. Scheduled work goes in `scheduled_alarms`. `agent_state` holds operational state the DO needs to function correctly across restarts, concurrent events, and multiple sessions.

Without this table, the DO would either:
- Re-run initialization on every restart, duplicating system skills and overwriting user state
- Have no protection against duplicate Curator or pattern detection runs firing simultaneously
- Have a read-before-write race on session turn numbers

## Design Decision: Key-Value Structure

`agent_state` is a flat key-value table. One row per key. Values are always stored as TEXT — the reader parses the value to the appropriate type (integer, boolean, JSON). No typed columns per key, no separate tables per category. Reason: the set of keys is not known at schema design time and grows as the product grows. A typed schema would require a migration every time a new operational flag is needed. Free text keys require no migration.

## Key Naming Convention

Keys follow a dot-namespaced format for readability and grouping:
- `do.initialized` — DO-level flags
- `turn_counter.{session_id}` — per-session counters
- `curator.last_run` — Curator operational timestamps
- `pattern_detection.last_run` — pattern detection timestamps

This is a convention, not enforced by SQL. New keys follow the same pattern.

## Known Keys at Launch

**`do.initialized`**
Value: `"1"` or `"0"`. Has this DO completed its full startup initialization — WAL mode set, system skills seeded, default agent_state keys created. Checked on every DO restart. If `"0"` or missing: run initialization. If `"1"`: skip initialization, DO is ready. Without this flag, every restart re-seeds system skills and duplicates rows.

**`turn_counter.{session_id}`**
Value: integer as string, e.g. `"7"`. The current turn number for an active session. Incremented atomically before every `session_turns` insert. Eliminates the read-before-write race that `MAX(turn_number)` would create — two concurrent writes reading the same MAX would produce duplicate turn numbers. Key is created when a session starts, deleted when the session ends.

**`curator.last_run`**
Value: unix timestamp ms as string. When the Curator last ran. Checked before scheduling a new Curator run — if last run was less than the minimum interval ago, skip scheduling. Without this, two rapid events could both trigger a Curator run simultaneously, producing duplicate trait updates and wasting tokens.

**`pattern_detection.last_run`**
Value: unix timestamp ms as string. Same purpose as `curator.last_run` but for the pattern detection pass.

**`active_session_id`**
Value: session UUID string or `""` (empty = no active session). Which session is currently open. Set when a session starts, cleared when it ends. Lets the DO answer "is there a live session right now" without querying `sessions WHERE status = 'active'`. Used as a guard before starting a new session.

**`memory.write_failure.{session_id}`**
Value: JSON string `{ namespace, key, error, ts }`. Written when `write_user_memory` fails after passing Zod validation — meaning the SQLite write itself failed. This is a silent failure mode: the agent believes it wrote a fact, the user sees a normal response, but the fact was never persisted. Logging to `agent_state` creates a diagnostic trail. Key is per-session so failures from multiple sessions do not overwrite each other. The Curator reads all `memory.write_failure.*` keys on its pass and logs them to a summary for developer inspection.

**`memory.empty_read.{session_id}`**
Value: JSON string `{ namespace, key_attempted, ts }`. Written when `read_user_memory` is called with a namespace that exists in the user's namespace list but returns zero active entries. This indicates a namespace where all entries have been deactivated — possibly over-aggressive Curator pruning. Not an error on its own, but repeated occurrences across sessions signal a pruning calibration problem.

**`curator.anomaly.{run_id}`**
Value: JSON string `{ type, detail, ts }`. Written when the Curator detects unexpected state during its pass:
- `type: "namespace_cap_reached"` — user is at exactly 40 namespaces, agent cannot create any new ones
- `type: "mass_deactivation"` — Curator deactivated more than 10 entries in a single pass (suggests aggressive pruning or a data quality problem)
- `type: "high_importance_stale"` — a fact with `importance >= 7` has `last_read` older than 90 days (important fact that is never being loaded — possible namespace misclassification)

These keys are never read during normal operation. They exist purely as a diagnostic trail for developers. The Curator does not act on them — it only writes them.

## CREATE TABLE

```sql
CREATE TABLE agent_state (
  key        TEXT PRIMARY KEY,  -- dot-namespaced key, e.g. 'do.initialized', 'turn_counter.{session_id}'
  user_id    TEXT NOT NULL,     -- owner — self-describing for export
  value      TEXT NOT NULL,     -- always TEXT — reader parses to correct type
  updated_at INTEGER NOT NULL   -- unix timestamp ms — when this key was last set
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const agentState = sqliteTable('agent_state', {
  key:       text('key').primaryKey(),
  userId:    text('user_id').notNull(),
  value:     text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
})
```

## Column Decisions

**`key` — TEXT PRIMARY KEY**
Natural primary key. Keys are globally unique within a DO instance. No UUID needed — the key string IS the identity. Upsert pattern: `INSERT OR REPLACE INTO agent_state (key, user_id, value, updated_at) VALUES (?, ?, ?, ?)`. Reads are always single-row by primary key — fast.

**`user_id` — kept**
Same reason as every table. Rows must be self-describing outside the DO for export and Data Studio.

**`value` — always TEXT**
All values stored as strings. Readers parse:
- Booleans: `value === "1"`
- Integers: `parseInt(value, 10)`
- Timestamps: `parseInt(value, 10)`
- UUIDs: `value` directly

No type coercion in SQL. Parsing happens in the application layer. This keeps the schema stable forever regardless of what new keys are added.

**`updated_at`**
Audit trail. When was this key last set. Useful for debugging — if `curator.last_run` was set 3 days ago but the Curator should run weekly, something is wrong.

## Write Rules

- Written by the DO's own internal logic only — never by the agent's user-facing tools, never by the Curator's domain logic.
- Upsert on every write: `INSERT OR REPLACE` — keys are created on first write, updated on subsequent writes.
- `turn_counter.{session_id}` — incremented before every `session_turns` insert. Deleted when session ends.
- `do.initialized` — set to `"1"` once at the end of the initialization routine. Never reset to `"0"` by any code path. If initialization must be re-run, the key is deleted manually by a developer.
- `active_session_id` — set when session starts, cleared (set to `""`) when session ends.

## Read Rules

- Read on every DO startup: `do.initialized` — determines whether initialization runs.
- Read before every `session_turns` insert: `turn_counter.{session_id}` — get current counter, increment, use as turn_number.
- Read before scheduling Curator or pattern detection: `curator.last_run`, `pattern_detection.last_run` — check minimum interval.
- Read as guard before new session start: `active_session_id`.
- Never injected into any user-facing prompt.

## Indexes

No additional indexes. All reads are by primary key (`key`). Primary key lookup in SQLite is always fast — no secondary index needed.

## What Is NOT Stored Here

- User facts and preferences → `user_memory`
- Personality traits → `user_personality`
- Scheduled future work → `scheduled_alarms`
- Session metadata → `sessions`
- Migration history → `schema_version` (`__drizzle_migrations`)
