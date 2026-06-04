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

## Write Rules

- Written ONLY by the Drizzle migrator at DO startup.
- Never written by application code, the agent, the Curator, or any alarm handler.
- If this table is accidentally dropped: all migration history is lost. The migrator will attempt to re-apply all migrations from scratch on the next startup — this will fail on existing tables with "table already exists" errors. Recovery requires manual intervention per affected DO instance.

## Read Rules

- Read by the Drizzle migrator at DO startup only.
- Never read by application code.
- Never injected into any prompt.

## What Is NOT Stored Here

- DO operational state → `agent_state`
- User data of any kind → every other table
