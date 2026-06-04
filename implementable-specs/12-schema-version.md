# Table: schema_version (managed by Drizzle as __drizzle_migrations)

## Why This Table Exists

A Cloudflare Durable Object can be evicted and restarted at any time. When a new code deployment arrives, the SQLite schema inside that user's DO might be at version 3 while the new code expects version 5. Without migration tracking, two things happen:

- Re-running all migrations on a schema that already has them applied corrupts data — tables get created twice, columns get added twice, data gets duplicated or lost.
- Skipping migrations entirely means the DO runs against a stale schema and crashes when it tries to access a column that does not exist yet.

`schema_version` is the solution. One row per applied migration. At every DO startup, the Drizzle migrator reads this table, compares the applied migrations against the migration files bundled with the current code deployment, and runs only the unapplied ones. Safe, idempotent, automatic.

## Decision: Drizzle Manages This Table, Not Application Code

Drizzle's `drizzle-orm/durable-sqlite/migrator` creates and manages this table automatically under the name `__drizzle_migrations`. Application code — the agent, the Curator, the alarm handler — never touches it. The only writer is the Drizzle migrator, called at DO startup before any other operation.

This is documented here because:
1. It is part of the schema every developer must understand
2. Its existence and timing are critical to the DO startup sequence
3. If a developer accidentally writes to it or drops it, migrations break for that user permanently

## The DO Startup Sequence

Every DO restart runs this sequence in order before handling any request:

```
1. Run Drizzle migrator
   → reads __drizzle_migrations
   → compares against migration files bundled in current deployment
   → applies any unapplied migrations in order
   → idempotent — safe to run on every startup

2. Set PRAGMA journal_mode=WAL
   → must be set after migrations, not before
   → persists for the lifetime of this DO instance

3. Read agent_state: do.initialized
   → "0" or missing → run initialization (seed system skills, set default state keys)
   → "1" → DO is ready, handle the incoming request
```

Steps 1, 2, 3 run on every cold start. If the DO was evicted mid-session and restarts, this sequence runs first, then the interrupted request is handled.

## What the Table Looks Like

Drizzle creates this table itself. The exact schema Drizzle uses for `drizzle-orm/durable-sqlite`:

```sql
CREATE TABLE __drizzle_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  hash       TEXT NOT NULL UNIQUE,  -- hash of the migration file content
  created_at INTEGER                -- unix timestamp ms — when this migration was applied
);
```

One row per applied migration. `hash` is derived from the migration file content — if the file changes after being applied, the hash no longer matches and Drizzle detects a conflict.

## Decision: Never Edit an Applied Migration File

Once a migration has been applied to any live DO (any real user's data), that migration file is frozen. Editing it changes its hash. Drizzle will see a hash mismatch and refuse to run — or worse, treat the edited file as a new unapplied migration and re-apply it, corrupting data.

The rule: migrations are append-only. If a mistake was made in migration 003, write migration 004 to fix it. Never edit 003.

## Decision: Migration Files Are Bundled With the Worker Deployment

Drizzle migration files must be bundled into the Cloudflare Worker deployment package. They are not fetched from an external source at runtime. Reason: the DO has no outbound network access during its startup sequence that would be reliable enough for fetching migration files. They travel with the code.

## Decision: FTS5 Triggers Must Live in Migrations, Not the Startup Sequence

SQLite does not support `CREATE TRIGGER IF NOT EXISTS`. Every other DDL statement accepts `IF NOT EXISTS` — `CREATE TABLE`, `CREATE INDEX`, `CREATE VIRTUAL TABLE` — but not triggers. This makes trigger creation non-idempotent: the first DO boot succeeds, every subsequent cold start crashes with "trigger already exists."

The four FTS5 sync triggers (two for `sessions_fts`, two for `session_turns_fts`) must therefore live inside a Drizzle migration file. The Drizzle migrator runs each migration file exactly once per DO instance — it tracks applied files via `__drizzle_migrations` and skips them on subsequent startups. This is the only path to idempotent trigger creation.

**Hard rule**: all DDL — tables, indexes, virtual tables, and triggers — lives in Drizzle migration files. None of it belongs in the startup sequence or application code. The startup sequence calls the Drizzle migrator at step 1 and trusts it to handle all DDL.

The workaround of `DROP TRIGGER IF EXISTS` then `CREATE TRIGGER` on every cold start is explicitly banned: it introduces a brief window per boot where the trigger does not exist, during which a write to `sessions` or `session_turns` would leave the FTS5 virtual table silently out of sync.

## Write Rules

- Written ONLY by the Drizzle migrator at DO startup.
- Never written by application code, the agent, the Curator, or any alarm handler.
- If this table is accidentally dropped: all migration history is lost. The migrator will attempt to re-apply all migrations from scratch on the next startup — this will fail on existing tables with "table already exists" errors. Recovery requires manual intervention per affected DO instance.

## Read Rules

- Read by the Drizzle migrator at DO startup only.
- Never read by application code.
- Never injected into any prompt.

---

## WAL Checkpoint Strategy

### What WAL Is and Why It Matters

`PRAGMA journal_mode=WAL` is set in step 2 of the startup sequence. WAL (Write-Ahead Log) changes how SQLite handles writes:

**Without WAL**: every write locks the main database file. Any read that arrives during a write must wait. Writers and readers block each other.

**With WAL**: writes go to a separate file — `main.db-wal` — instead of directly to the main database file. Readers read from the main file plus any relevant entries in the WAL file, stitched together on the fly. Writers write to the WAL file. Readers and writers never block each other. This is why WAL mode is set — Brioela's DO handles concurrent reads (session context loading, skill index injection) alongside writes (tool calls, turn recording) and they must not block each other.

### The WAL Growth Problem

Every write adds an entry to the WAL file. The WAL file grows. If it grows without bound, two problems occur:

**Problem 1 — Cold start latency**: When a DO starts up after being evicted (idle eviction is common on Cloudflare — a DO that has not received a request in a while is shut down to free resources), it must replay the WAL file to reconstruct the current database state before it can serve any request. A large WAL file means a slow replay. A user's first request after the DO was idle could take seconds instead of milliseconds.

**Problem 2 — Storage bloat**: The WAL file occupies storage space in addition to the main database file. A user with thousands of sessions and hundreds of tool calls per session could accumulate megabytes of WAL that duplicates data already reflected in the main file.

### The Checkpoint — Flushing WAL Back to the Main File

A checkpoint reads all entries from the WAL file and writes them into the main database file, then resets the WAL file. After a full checkpoint:

```
Before checkpoint:
  main.db      — state as of 3 days ago
  main.db-wal  — 47MB of writes accumulated since then

After checkpoint (TRUNCATE mode):
  main.db      — fully current, includes all 47MB of changes
  main.db-wal  — 0 bytes (reset to empty)
```

The main file is now the single source of truth. The WAL is empty. Cold start is fast again.

### Three Checkpoint Modes

SQLite has three checkpoint modes, each progressively more aggressive:

**`PASSIVE`**: checkpoints as much as it can without blocking any reader or writer. If a reader is mid-read, it skips WAL entries that reader is using and checkpoints the rest. Fast, never blocks, but may leave some WAL entries behind. The WAL does not reset to zero if any entries were skipped.

**`FULL`**: waits for all readers to finish, then checkpoints all WAL entries. Blocks until complete. WAL entries are fully flushed but the WAL file is not truncated to zero — it keeps its file size even though it is logically empty.

**`TRUNCATE`**: same as FULL — waits for all readers, flushes all WAL entries — but ALSO truncates the WAL file to zero bytes. This is the only mode that fully resets WAL file size. After a TRUNCATE checkpoint, the WAL file is gone from disk.

### What Brioela Uses

**Auto-checkpoint (automatic, always on)**: SQLite's built-in `wal_autocheckpoint` fires automatically every 1,000 pages of WAL (approximately 4MB at the default 4KB page size). This is the continuous maintenance mechanism — it keeps the WAL from growing out of control during normal operation. The default of 1,000 pages is correct for Brioela. **Never set `wal_autocheckpoint = 0`** — this disables auto-checkpoint entirely. The WAL would then grow forever until the DO is evicted and restarted, at which point cold start could take many seconds.

```typescript
// Already set in DO startup sequence — do not change this value
db.run(sql`PRAGMA wal_autocheckpoint = 1000`)
// 1000 pages × 4096 bytes/page = ~4MB WAL before auto-checkpoint fires
```

**Curator TRUNCATE checkpoint (periodic, forced)**: At the end of every `curator_run`, after all maintenance passes complete, the Curator triggers a forced TRUNCATE checkpoint. This ensures that regardless of what auto-checkpoint missed (partial checkpoints, readers that held back some WAL entries), the WAL is fully flushed and reset to zero bytes at least weekly.

```typescript
// Last operation inside the curator_run alarm handler, after all passes complete:
db.run(sql`PRAGMA wal_checkpoint(TRUNCATE)`)
```

Why the Curator is the right moment for this:
- The Curator already has the DO awake and running background work — no extra wake-up cost
- The Curator run frequency (weekly) is exactly right for a forced full flush — not too frequent (unnecessary overhead), not too infrequent (WAL grows for months)
- During the Curator pass, all sub-agent tool calls have completed — no active readers are mid-read when the checkpoint runs
- The forced TRUNCATE guarantees the WAL resets to zero bytes, not just "mostly checkpointed" as PASSIVE mode would leave it

### What Happens If a Checkpoint Is Blocked

`PRAGMA wal_checkpoint(TRUNCATE)` returns a result indicating how many WAL frames were checkpointed and how many were moved to the main file:

```typescript
const result = db.get<{ busy: number, log: number, checkpointed: number }>(
  sql`PRAGMA wal_checkpoint(TRUNCATE)`
)
// busy:         1 if checkpoint could not complete (readers blocking), 0 if clean
// log:          total WAL frames
// checkpointed: frames successfully moved to main file
```

If `busy = 1` — a reader held the checkpoint back. This is acceptable. The auto-checkpoint mechanism will clean up the remaining frames on the next write cycle. The Curator logs this result to `agent_state`:

```typescript
db.insert(agentState)
  .values({
    key:       'curator.last_checkpoint',
    userId:    ctx.userId,
    value:     JSON.stringify({ busy: result.busy, log: result.log, checkpointed: result.checkpointed, ts: Date.now() }),
    updatedAt: Date.now(),
  })
  .onConflictDoUpdate({ target: agentState.key, set: { value: sql`excluded.value`, updatedAt: Date.now() } })
  .run()
```

This gives developers a diagnostic signal: if `busy = 1` repeatedly across many Curator runs, something is holding readers open longer than expected — worth investigating.

### Updated DO Startup Sequence

Step 2 now includes the WAL autocheckpoint setting explicitly:

```
1. Run Drizzle migrator
   → reads __drizzle_migrations
   → applies any unapplied migrations in order

2. Set WAL mode and autocheckpoint
   → PRAGMA journal_mode=WAL
   → PRAGMA wal_autocheckpoint=1000   ← explicit, never 0
   → both persist for the lifetime of this DO instance

3. Read agent_state: do.initialized
   → missing or "0" → run initialization sequence
     - seed system skills
     - set default agent_state keys
     - schedule first curator_run alarm (7 days from now)
     - schedule first pattern_detection alarm (3 days from now)
   → "1" → DO is ready, handle the incoming request
```

### Hard Rules

- **Never set `wal_autocheckpoint = 0`** — WAL grows forever, cold starts degrade
- **Never call `PRAGMA journal_mode=DELETE`** — this turns off WAL mode and loses the concurrency benefits. Once WAL is set, it stays WAL.
- **The Curator TRUNCATE checkpoint is the only forced full flush** — nothing else in the system calls `PRAGMA wal_checkpoint` explicitly. No application code, no agent, no alarm handler other than the Curator's final step.
- **Checkpoint result is always logged** — `curator.last_checkpoint` in `agent_state` gives a diagnostic trail. Never silently discard the result.

## What Is NOT Stored Here

- DO operational state → `agent_state`
- User data of any kind → every other table
