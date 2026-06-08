# Brain SQLite Migration Runtime

## What This File Covers

The production migration system for the per-user `BrioelaBrain` SQLite database. This is not a normal single-database migration problem. One user means one private SQLite database inside one Durable Object. Millions of users means millions of private SQLite databases, each waking and migrating at different times.

This file defines the runtime contract for safe migrations: Drizzle-generated migration artifacts, the Brain migration manifest, per-Brain locks, readiness states, rollout control, smoke tests, destructive-change rules, telemetry, and deployment sequencing.

## Core Principle

Deploying code must not mean blindly mutating every user's private database.

For Brain SQLite, migration is lazy, per-user, observable, gated, and smoke-tested. Drizzle owns schema generation, migration application, and ORM access. Brioela owns the fortress above Drizzle: permission to migrate, when to migrate, whether the migrated Brain is safe, and what the runtime may serve afterward.

A Brain is not allowed to serve normal reads, writes, Mira context, or tool calls until its schema is compatible with the running code and the post-migration smoke tests pass.

Hard doctrine:

```text
Cloudflare Durable Object SQLite = storage engine
Drizzle durable-sqlite = schema, generated migrations, migrator, ORM language
Brioela migration runtime = safety gate above Drizzle
Brioela guards = enforcement against bypassing Drizzle or readiness
```

## Why Brain SQLite Is More Dangerous Than Postgres

Supabase Postgres is one shared operational database. A migration happens centrally, under one deployment window, with mature centralized tooling.

Brain SQLite is physically isolated per user:

```text
1 user       = 1 private SQLite database
1M users     = 1M private SQLite databases
100M users   = 100M private SQLite databases
```

That means a migration is not one event. It is a long-running distributed rollout across Durable Objects that wake at different times. The migration runtime must assume:

- a user can wake on an old schema months after a deploy
- a Brain can be evicted during startup or migration
- a user can arrive during a live-critical path such as Mira cooking
- a migration may succeed structurally but fail product smoke checks
- a failed migration affects private user truth and must never be hidden

## Folder Shape

Future code should use this structure:

```text
backend/src/agents/brain/
├── _schema/
│   ├── brain.schema.ts
│   ├── memory.schema.ts
│   ├── migration.schema.ts
│   └── index.ts
├── _database/
│   ├── create.brain.database.helper.ts
│   ├── brain.database.type.ts
│   └── index.ts
├── _repositories/
│   ├── memory.repository.ts
│   ├── readiness.repository.ts
│   ├── migration.run.repository.ts
│   ├── smoke.result.repository.ts
│   └── index.ts
├── _migrations/
│   ├── brain.migration.manifest.ts
│   ├── drizzle.migrations.ts
│   ├── index.ts
│   ├── _handlers/
│   │   ├── run.brain.migrations.handler.ts
│   │   ├── run.brain.migration.smoke.handler.ts
│   │   └── index.ts
│   ├── _helpers/
│   │   ├── acquire.brain.migration.lock.helper.ts
│   │   ├── release.brain.migration.lock.helper.ts
│   │   ├── read.brain.schema.readiness.helper.ts
│   │   ├── write.brain.schema.readiness.helper.ts
│   │   ├── record.brain.migration.run.helper.ts
│   │   ├── select.pending.brain.migrations.helper.ts
│   │   └── index.ts
│   ├── _policies/
│   │   ├── assert.brain.migration.allowed.policy.ts
│   │   └── index.ts
│   ├── _smoke/
│   │   ├── _handlers/
│   │   │   ├── smoke.brain.core.context.handler.ts
│   │   │   ├── smoke.brain.memory.write.handler.ts
│   │   │   ├── smoke.brain.active.session.handler.ts
│   │   │   ├── smoke.brain.fts.integrity.handler.ts
│   │   │   ├── smoke.brain.alarm.ledger.handler.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── _types/
│       ├── brain.migration.type.ts
│       ├── brain.migration.readiness.type.ts
│       └── index.ts
└── drizzle/
    ├── 0000_initial.sql
    ├── 0001_add_memory_event_indexes.sql
    └── meta/
```

Naming rules:

- Drizzle-generated SQL files keep Drizzle's generated names and layout.
- Generated migration artifacts are an approved generated boundary; do not rename them just to satisfy Brioela role-suffix rules.
- Never rename an applied migration file.
- Never edit an applied migration file.
- Fix mistakes with a new migration.
- Runtime files use the normal Brioela role suffixes: `.handler.ts`, `.helper.ts`, `.policy.ts`, `.type.ts`.
- Runtime files must live under matching role folders.

## Migration Manifest

Every shipped Drizzle migration has a typed manifest entry. Drizzle applies SQL. The manifest tells Brioela whether that migration is allowed to run for this Brain, how dangerous it is, and how to prove the Brain is safe afterward.

```typescript
export const brainMigrationManifest = {
  targetSchemaVersion: 3,
  minReadableSchemaVersion: 2,
  migrations: [
    {
      id: '0001_add_memory_event_indexes',
      file: '0001_add_memory_event_indexes.sql',
      from: 2,
      to: 3,
      phase: 'expand',
      risk: 'medium',
      destructive: false,
      expectedObjects: [
        { kind: 'table', name: 'recipe_source_artifacts' },
        { kind: 'index', name: 'idx_recipe_source_artifacts_recipe' },
      ],
      smoke: [
        'brain.core.context',
        'brain.memory.write',
        'brain.active.session',
      ],
    },
  ],
} as const
```

Required fields:

| Field | Meaning |
|---|---|
| `id` | Stable migration id. For generated Drizzle migrations, use the generated file name without `.sql`. |
| `file` | Drizzle-generated SQL file bundled with Worker deployment. |
| `from` / `to` | Product schema version transition. |
| `phase` | `expand`, `dual_write`, `backfill`, `verify`, or `contract`. |
| `risk` | `low`, `medium`, `high`, or `blocked`. |
| `destructive` | `true` only for contract-phase cleanup after proven compatibility. |
| `expectedObjects` | Tables, columns, indexes, triggers, FTS objects expected afterward. |
| `smoke` | Named smoke checks that must pass before readiness becomes `ready`. |

Hard rule: every manifest migration must have a smoke list. Empty smoke lists are illegal.

## Product Migration Tables

Drizzle owns `__drizzle_migrations`. Brioela must not replace it, write to it, or infer product readiness from it alone.

Brioela adds product-level migration tables so the Brain can know whether it is safe to serve. Drizzle answers: did this migration apply? Brioela answers: is this user's Brain ready for product code?

### `brain_schema_readiness`

```sql
CREATE TABLE brain_schema_readiness (
  id                   TEXT PRIMARY KEY DEFAULT 'brain',
  schema_version        INTEGER NOT NULL,
  min_readable_version  INTEGER NOT NULL,
  target_version        INTEGER NOT NULL,
  status                TEXT NOT NULL,
  last_migration_id     TEXT,
  last_smoke_status     TEXT,
  last_error_json       TEXT,
  updated_at            INTEGER NOT NULL
);
```

Allowed statuses:

```text
ready
migrating
blocked_by_control_plane
needs_retry
migration_failed
read_only_degraded
incompatible_code
```

### `brain_migration_runs`

```sql
CREATE TABLE brain_migration_runs (
  id                 TEXT PRIMARY KEY,
  migration_id       TEXT NOT NULL,
  from_version       INTEGER NOT NULL,
  to_version         INTEGER NOT NULL,
  phase              TEXT NOT NULL,
  risk               TEXT NOT NULL,
  started_at         INTEGER NOT NULL,
  finished_at        INTEGER,
  status             TEXT NOT NULL,
  attempt            INTEGER NOT NULL,
  error_json         TEXT,
  deployment_id      TEXT NOT NULL
);

CREATE INDEX idx_brain_migration_runs_migration ON brain_migration_runs (migration_id, started_at DESC);
CREATE INDEX idx_brain_migration_runs_status    ON brain_migration_runs (status, started_at DESC);
```

### `brain_migration_smoke_results`

```sql
CREATE TABLE brain_migration_smoke_results (
  id              TEXT PRIMARY KEY,
  migration_run_id TEXT NOT NULL,
  smoke_name      TEXT NOT NULL,
  status          TEXT NOT NULL,
  duration_ms     INTEGER NOT NULL,
  details_json    TEXT,
  created_at      INTEGER NOT NULL
);

CREATE INDEX idx_brain_migration_smoke_run ON brain_migration_smoke_results (migration_run_id);
```

These tables are created in the initial schema and then used by all future migrations.

## Startup Sequence

Every Brain wake runs this order before any normal product operation:

```text
1. Enter startup critical section with blockConcurrencyWhile.
2. Create typed Drizzle DB over DO SQLite.
3. Acquire Brain migration lock through Drizzle repositories.
4. Read control-plane rollout policy.
5. Run Drizzle durable-sqlite migrator for allowed pending migrations.
6. Verify Drizzle migration state.
7. Run Brioela product migration runtime checks.
8. Run required smoke tests through Drizzle repositories.
9. Set readiness to ready.
10. Release migration lock.
11. Serve request, callable RPC, schedule callback, or alarm.
```

If any migration or smoke check fails, readiness is not `ready`. The Brain returns a typed unavailable/degraded response instead of serving new code against uncertain data.

## Migration Lock

Only one migration runner may execute per Brain at a time.

Lock key:

```text
agent_state.brain_schema.migration_lock
```

Lock value:

```json
{
  "runId": "uuid",
  "deploymentId": "2026-06-08T...",
  "startedAt": 1780000000000,
  "expiresAt": 1780000060000
}
```

Rules:

- Lock acquisition is compare-and-set inside the startup critical section.
- Stale locks can be taken over only after `expiresAt`.
- A live active session blocks high-risk migrations.
- A failed migration releases the lock after writing failure state.

## Control Plane

Migration rollout is controlled centrally. The control plane may live in Supabase Postgres because it stores operational rollout metadata, not private user memory.

Control-plane fields:

```text
migration_id
enabled
rollout_percentage
canary_user_ids
blocked_user_ids
allowed_environments
kill_switch
max_failures_per_hour
started_at
updated_at
```

Rollout sequence:

```text
0. local/dev only
1. internal canary users
2. 1%
3. 5%
4. 25%
5. 50%
6. 100%
```

If failure rate crosses the threshold, the control plane flips the migration to blocked. Brains already migrated stay migrated. Brains not yet migrated stop before the risky migration and report `blocked_by_control_plane`.

## Safe Timing Rules

Allowed moments:

- cold start before serving the first request
- scheduled Brain maintenance wake
- idle user window
- before opening a new Mira session
- explicit developer smoke run

Blocked moments:

- active Mira cooking session
- active voice/video stream
- active Brain tool write
- active BrainMaintenanceAgent pass
- active BehaviorPatternAgent pass
- active long-running provider call

If a low-risk expand migration is needed during a request, the Brain may migrate before serving. If a high-risk or blocked migration is needed, the Brain returns a typed retry/degraded response.

## Expand, Dual-Write, Backfill, Verify, Contract

Destructive migrations are banned unless they are the final contract phase of a proven rollout.

Use this sequence:

```text
Expand      add nullable column/table/index; old and new code both work
Dual-write  write old and new shapes simultaneously
Backfill    lazily fill new shape per Brain, safely retryable
Verify      smoke and consistency checks prove new shape is complete
Contract    remove old shape only after enough time and telemetry
```

Examples:

- Adding a nullable column: `expand`, low risk.
- Adding a new table and index: `expand`, low or medium risk.
- Populating derived data from old rows: `backfill`, medium risk.
- Dropping a column/table: `contract`, high risk, blocked by default.

## Smoke Tests

Smoke tests run against the user's actual SQLite after migrations. They must be cheap, deterministic, and safe.

Required smoke categories:

| Smoke | Purpose |
|---|---|
| `brain.core.context` | Load session context primitives without crashing. |
| `brain.memory.write` | Insert/read/rollback a synthetic memory fact. |
| `brain.active.session` | Check active session query still works. |
| `brain.fts.integrity` | Validate FTS tables/triggers when affected. |
| `brain.alarm.ledger` | Validate scheduled_alarms read/write when affected. |
| `brain.recipe.library` | Validate recipe read/write when affected. |

Smoke test rules:

- Prefer transaction + rollback.
- Synthetic rows use ids prefixed with `__smoke__`.
- Smoke tests never call LLMs.
- Smoke tests never write permanent user facts.
- Smoke failures block readiness.
- Smoke results are recorded in `brain_migration_smoke_results`.

## Readiness Gate

Every public Brain entry point checks readiness before doing real work:

```text
fetch
callable RPC methods
schedule callbacks
alarm handler
Mira context loader
Brain-owned child agent dispatch
```

Allowed behavior by readiness:

| Status | Behavior |
|---|---|
| `ready` | Serve normally. |
| `migrating` | Return retryable maintenance response. |
| `blocked_by_control_plane` | Return retryable maintenance response; emit telemetry. |
| `needs_retry` | Schedule retry/backoff; return retryable maintenance response. |
| `migration_failed` | Block writes; return typed failure; alert. |
| `read_only_degraded` | Serve safe reads only if current code supports old schema. |
| `incompatible_code` | Block all normal operations. |

No code path bypasses readiness for convenience.

## Compatibility Window

Code must support at least one previous readable schema version during rollout.

```text
targetSchemaVersion = 12
minReadableSchemaVersion = 11
```

If a Brain is below `minReadableSchemaVersion`, it cannot run normal code until it migrates. If it is between min and target, code may serve read-only/degraded paths while migration waits for a safe moment.

## Retry And Backoff

Migration retries are bounded and observable:

```text
attempt 1: immediate retry if lock was stale or transient busy
attempt 2: 1 minute
attempt 3: 5 minutes
attempt 4: 30 minutes
attempt 5+: blocked until control plane or developer action
```

Every retry writes a `brain_migration_runs` row. Repeated failures for the same migration count toward the control-plane kill switch.

## Rollback Policy

SQLite Brain migrations are forward-fix by default.

Rollback is not a normal operation because millions of Brains may be at different schema versions. Instead:

- stop rollout with the control-plane kill switch
- ship a forward-fix migration
- keep old columns/tables during compatibility window
- never depend on rolling all users backward

Destructive contract-phase migrations require a separate human approval checklist in the migration manifest and must be blocked by default until enabled.

## Observability

Every migration emits:

```text
deployment_id
user_id hash only, not raw user id in global telemetry
migration_id
from_version
to_version
status
duration_ms
smoke_status
error_code
safe_timing_reason
```

Private details stay inside the user's Brain SQLite. Global telemetry receives hashed or aggregated metadata only.

## Developer Workflow

1. Generate migration SQL.
2. Add manifest entry.
3. Add or update smoke tests.
4. Run local fresh-Brain test.
5. Run local old-Brain migration test.
6. Run failure-injection test.
7. Update migration baseline snapshots.
8. Deploy with control-plane rollout disabled.
9. Enable internal canary users.
10. Watch migration success/failure telemetry.
11. Increase rollout gradually.

## Hard Bans

- No DDL outside migration SQL files.
- No competing hand-written SQLite migrator.
- No editing applied migration files.
- No deleting applied migration files.
- No startup-created triggers.
- No `DROP TABLE` or `DROP COLUMN` in expand phase.
- No migration without manifest entry.
- No manifest entry without smoke tests.
- No Brain product code calling `ctx.storage.sql`, `.storage.sql`, raw `sql\`...\``, `db.run`, `db.get`, `db.all`, or `db.values`.
- No Brain feature importing schema tables directly when a repository/store owns that table.
- No normal Brain work while readiness is not `ready` unless explicitly read-only degraded.
- No LLM calls inside migration or smoke tests.
- No permanent synthetic user facts from smoke tests.
- No bypassing the control plane in production.

## First Implementation Slice

Before feature work depends on Brain SQLite, implement and prove:

1. Initial migration creates product migration tables.
2. Startup obtains migration lock.
3. Runtime reads manifest and readiness.
4. One harmless expand migration runs.
5. Smoke test success sets readiness to `ready`.
6. Smoke test failure sets `migration_failed` and blocks writes.
7. Control-plane blocked migration sets `blocked_by_control_plane`.
8. `bun run guard:verify` stays clean.

This migration runtime is the foundation under the Brain. No user-private feature should ship before this path exists.
