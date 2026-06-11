# Brain Foundation — Spec

Feature **06**. Per-user `BrioelaBrain` Durable Object: SQLite spine, Drizzle schema, migration runtime, readiness gate, and the minimal callable RPC surface every later brain feature builds on.

---

## Purpose

Each Brioela user gets one private SQLite database inside one `BrioelaBrain` Durable Object instance. This feature owns:

1. **DO provisioning** — `new_sqlite_classes`, `BRIOELA_BRAIN` binding, Worker export.
2. **Drizzle spine** — typed database over `ctx.storage`, all product table schemas, generated SQL migrations.
3. **Migration runtime** — Drizzle migrator + Brioela product layer: lock, runs, smoke, readiness.
4. **Startup gate** — `blockConcurrencyWhile` runs migrations before any callable serves.
5. **Foundation RPC** — `checkReadiness`, plus memory append/list callable stubs wired for smoke and feature 07.

This is **not** the full brain product surface from `build-guide/05-brain/01-do-class-and-setup.md`. Handlers, context loaders, policies, schedules, subagents, and the full RPC catalog are separate features (08–22+).

---

## Architecture (three layers)

```text
Cloudflare DO SQLite          ← storage engine (one file per user)
        │
Drizzle durable-sqlite        ← schema, __drizzle_migrations, ORM
        │
Brioela migration runtime     ← lock, runs, smoke, schema_readiness
        │
BrioelaBrain Agent class      ← startup gate + @callable() boundary
```

Hard doctrine (from `08-brain-sqlite-migration-runtime.md` + `12-schema-version.md`):

- Drizzle proves SQL files applied (`__drizzle_migrations`).
- Brioela proves the Brain is safe to serve (`schema_readiness`, smoke results).
- Both are required before normal product work.
- No feature code calls `ctx.storage.sql` directly — Drizzle repositories only.

---

## DO addressing

- Binding name in production: `BRIOELA_BRAIN` (build guide sample uses `BRAIN` — naming drift, production is `BRIOELA_BRAIN`).
- Always `env.BRIOELA_BRAIN.idFromName(userId)` — stable per user, no pooling.
- Class: `BrioelaBrain extends Agent<Cloudflare.Env, BrioelaBrainState>`.
- Agent state in memory: `{ ready: boolean }` synced from migration readiness on boot.

---

## Startup sequence (intended vs shipped)

### Intended (build guide + schema-version spec)

```text
1. blockConcurrencyWhile — startup critical section
2. createDatabase(ctx.storage)
3. runBrainMigrations — Drizzle apply + product safety layer
4. PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=1000
5. Read agent_state.do.initialized — seed system skills if missing
6. Serve fetch / callable / schedule / alarm
```

### Shipped (evidence: brioela.brain.agent.ts)

Steps 1–3 only. Steps 4–5 are **open gaps** (G1, G2). No readiness check on callable methods except `checkReadiness` itself (G18).

---

## Product tables (Drizzle schemas)

All tables live under `backend/src/agents/brain/_schemas/`. Initial migration `0000_rapid_rachel_grey.sql` creates:

| Table | Role | Spec / guide |
|---|---|---|
| `agent_state` | DO operational KV (turn counters, locks, init flags) | `11-agent-state.md` |
| `memory_event` | Append-only event log | `06-brain-memory/01-sqlite-schema.md` |
| `user_memory` | Mergeable facts | same |
| `user_personality` | Inferred traits | same |
| `skills` / `skill_versions` | Agent skills + history | skill specs |
| `constraints` | Allergy/dietary constraints | `06-constraints.md` |
| `sessions` / `session_turns` | Conversation lifecycle | `07-sessions.md`, `08-session-turns.md` |
| `recipes` / `recipe_versions` | Recipe library | `09-recipes.md` |
| `scheduled_alarms` | Alarm ledger | alarm specs |
| `schema_readiness` | Product migration readiness singleton | `08-brain-sqlite-migration-runtime.md` |
| `migration_runs` | Per-run audit trail | same |
| `migration_smoke_results` | Smoke evidence rows | same |

Drizzle-managed (not in app schemas): `__drizzle_migrations`.

### FTS5 (migration 0001)

Custom SQL migration adds virtual tables + sync triggers (Drizzle cannot express FTS/triggers in TS):

- `sessions_fts` + `sessions_fts_trigram` on `outcome_summary`
- `session_turns_fts` + `session_turns_fts_trigram` on `content`
- `unicode61` for Latin; `trigram` for multilingual

Subsequent migrations 0002–0007: skill_versions columns, recipe versioning, origin rename, alarm `triggering_session_id`.

---

## Migration manifest (intended vs shipped)

### Intended (`08-brain-sqlite-migration-runtime.md`)

Typed `brainMigrationManifest` per migration with:

- `id`, `file`, `from`/`to` version, `phase`, `risk`, `destructive`
- `expectedObjects` (tables, indexes, FTS, triggers)
- non-empty `smoke` list per migration

### Shipped

- Generated bundle: `brain.migration.ts` (journal + inlined SQL strings)
- Manifest generator tool: `tools/brioela-brain-migration-manifest/`
- **No** typed per-migration manifest with phase/risk/smoke lists (G3)
- Smoke is a single hardcoded handler, not manifest-driven (G4)

---

## Migration lock

Key in `agent_state`: `schema.migration_lock` (spec doc says `brain_schema.migration_lock` — **naming drift G5**).

Lock JSON (Zod `migrationLockSchema`):

```json
{ "runId", "deploymentId", "startedAt", "expiresAt" }
```

Rules shipped:

- TTL 60s (`migrationLockTtlMs`)
- Live unexpired lock → `BrainMigrationLockedError` → readiness `needs_retry`, lock not stolen
- Lock released on success; failed run releases only if it owned the lock

---

## Readiness states

`schema_readiness.status` allowed values (schema CHECK):

```text
ready | migrating | blocked_by_control_plane | needs_retry
migration_failed | read_only_degraded | incompatible_code
```

Shipped runtime returns only `'ready' | 'migration_failed' | 'needs_retry'` on the Agent boundary (`BrainMigrationReadiness`). Other statuses exist in schema but are not produced by current handlers (G6).

---

## Smoke tests

### Intended categories

| Smoke id | Purpose |
|---|---|
| `brain.core.context` | Session context primitives load |
| `brain.memory.write` | Synthetic memory write/read/rollback |
| `brain.active.session` | Active session query |
| `brain.fts.integrity` | FTS tables when affected |
| `brain.alarm.ledger` | scheduled_alarms when affected |
| `brain.recipe.library` | recipes when affected |

### Shipped

Single smoke in `run.migration.smoke.handler.ts`:

- Writes idempotent `memory_event` via `writeMemoryEventOnce` (kind `schema-readiness-smoke`)
- Lists one event via `listMemoryEvents`
- Records smoke name `'memory.write'` (not manifest id `brain.memory.write`)
- Sets readiness `ready`

FTS integrity is tested in `run.migrations.handler.test.ts` (4th test), not as a recorded smoke row (G7).

---

## Callable RPC surface

### Intended (build guide)

```text
readBrainContext
writeBrainMemory
appendMemoryEvent
checkActiveSession
checkReadiness (implied by runtime)
```

### Shipped on `BrioelaBrain`

| Method | Status |
|---|---|
| `appendMemoryEvent` | shipped (feature 07 owns semantics) |
| `listMemoryEvents` | shipped |
| `checkReadiness` | shipped |
| `readBrainContext` | not built |
| `writeBrainMemory` | not built (tools write via executables, not RPC) |
| `checkActiveSession` | not built |
| `fetch` override | not built |
| `dispatchBrainSchedule` | not built |

Memory RPCs do **not** check readiness before serving (G18).

---

## Folder shape (intended vs shipped)

Build guide describes `_schema/` (singular); production uses `_schemas/` (plural) — **acceptable drift**, not a gap.

Not present in production (separate future features):

```text
_handlers/          session create/finalize, schedule dispatch
_context/           Mira scene, session load/compress
_policies/          tool auth, memory write, privacy
_schedules/         maintenance, behavior pattern
_subagents/         maintenance, behavior-pattern, compressor
_migrations/_smoke/ categorized smoke handlers
_migrations/_policies/ control-plane assert
```

---

## Control plane (not built)

Supabase-backed rollout metadata: canary users, percentages, kill switch, `blocked_by_control_plane` status. Documented in build guide; no runtime evaluator (G8).

---

## WAL and initialization (not built)

After migrations, spec requires:

```sql
PRAGMA journal_mode=WAL;
PRAGMA wal_autocheckpoint=1000;
```

No PRAGMA calls exist in brain codebase (grep confirmed). `do.initialized` seed path (system skills, default agent_state keys) not wired in DO constructor (G1, G2).

---

## Compatibility window

Intended: `targetSchemaVersion` + `minReadableSchemaVersion` with code supporting N-1 during rollout.

Shipped: readiness writes `minReadableVersion = targetVersion = migration.idx` always — no N-1 window in runtime (G9).

---

## Retry and backoff

Intended: bounded retries with 1m / 5m / 30m backoff and attempt counting across runs.

Shipped: lock conflict returns `needs_retry` once; no scheduled retry alarm, no attempt escalation (G10).

---

## Observability

Intended: deployment_id, hashed user_id, duration_ms, smoke_status in global telemetry.

Shipped: `deploymentId = drizzle-${migration.tag}` locally; no telemetry emission (G11).

---

## Developer workflow

```bash
cd backend && bun run brain:db:generate   # drizzle-kit + manifest regen
cd backend && bun run brain:db:check
cd backend && bun run brain:typecheck
cd backend && bun run brain:test
```

Manifest tool: `tools/brioela-brain-migration-manifest/`.

---

## Hard bans (from build guide — enforcement status)

| Rule | Enforced? |
|---|---|
| No DDL outside migration SQL | yes (Drizzle-only) |
| No editing applied migrations | process/docs |
| No migration without smoke | partial — one smoke only |
| No manifest without smoke list | no — manifest lacks smoke lists |
| No bypass readiness on entrypoints | no — memory RPCs bypass |
| No raw ctx.storage.sql in features | yes for brain code reviewed |
| No LLM in smoke | yes |
| No control-plane bypass in prod | N/A — no control plane |

---

## Cross-feature boundaries

- **07-brain-memory-tools** — tool executables + memory write repo semantics; depends on 06 schemas + RPC wiring.
- **08+** — skill/constraint/session/recipe/alarm tools use tables defined here.
- **22-brain-chat-runtime** — must gate on readiness and wire `getBrainTools()`.
- **14-brain-sub-agents** — subagents call Brain via typed RPC (not built).

---

## Sources

- `build-guide/05-brain/01-do-class-and-setup.md`
- `build-guide/05-brain/08-brain-sqlite-migration-runtime.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `implementable-specs/11-agent-state.md`
- `implementable-specs/12-schema-version.md`
- `_records/implementation-ledger/brain/01-drizzle-spine/0001.initial-spine.md`
- `_records/implementation-ledger/brain/02-sqlite-migration-runtime/0001.design.docs.md`
- `_records/implementation-ledger/brain/02-sqlite-migration-runtime/0002.runtime-repositories.md`
- `_records/implementation-ledger/brain/02-sqlite-migration-runtime/implementation/0001.schema-indexes-alignment.md`
- `_records/implementation-ledger/brain/02-sqlite-migration-runtime/implementation/0002.fts5-and-sync-triggers.md`
