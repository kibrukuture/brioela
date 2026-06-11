# Status

open

DO class, Drizzle spine, migration runtime, readiness tables, and minimal callable RPC exist in `backend/`. Feature is **not** fully done per build guide + schema-version spec — see gaps below. Partial backend does not downgrade scope.

# Shipped in backend (partial)

- [x] `BrioelaBrain` Agent class with `blockConcurrencyWhile` → `runMigrations`
- [x] `BRIOELA_BRAIN` binding + `new_sqlite_classes: ["BrioelaBrain"]` in `wrangler.jsonc`
- [x] Drizzle schemas for all product tables (16 table modules + helpers)
- [x] 8 Drizzle SQL migrations (0000–0007) including FTS5 + triggers (0001)
- [x] Generated `brain.migration.ts` bundle + manifest tool
- [x] Migration runtime: Drizzle apply → lock → runs → smoke → `schema_readiness`
- [x] Migration lock via `agent_state` key `schema.migration_lock`
- [x] `@callable()` `checkReadiness`, `appendMemoryEvent`, `listMemoryEvents`
- [x] Workers tests: boot ready, idempotent rerun, live lock, FTS trigger sync (4 tests)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `PRAGMA journal_mode=WAL` / `wal_autocheckpoint` after migrations | Spec `12-schema-version.md` step 3; no PRAGMA in brain codebase |
| G2 | No `do.initialized` startup seed (system skills, default agent_state keys) | Spec `11-agent-state.md`; constructor only runs migrations |
| G3 | No typed per-migration manifest (phase, risk, expectedObjects, smoke list) | Build guide manifest shape; only generated SQL bundle exists |
| G4 | Smoke not manifest-driven — single hardcoded `memory.write` handler | `run.migration.smoke.handler.ts` |
| G5 | Lock key `schema.migration_lock` vs spec `brain_schema.migration_lock` | `migration.lock.repository.ts` vs build guide |
| G6 | Readiness statuses `blocked_by_control_plane`, `read_only_degraded`, `incompatible_code` never produced | Schema CHECK exists; runtime only returns ready/failed/needs_retry |
| G7 | Missing smoke categories: core.context, active.session, fts.integrity (as rows), alarm.ledger, recipe.library | Build guide smoke table; FTS tested in test file not smoke table |
| G8 | No control-plane rollout / kill switch | Ledger 0001.initial-spine "Not Implemented" |
| G9 | No minReadable vs target compatibility window (always sets both = idx) | `run.migrations.handler.ts` writeSchemaReadiness |
| G10 | No retry/backoff scheduling after `needs_retry` | Build guide retry table |
| G11 | No migration telemetry (duration, hashed user, global emit) | Build guide observability section |
| G12 | No smoke failure injection test | Ledger 0002.runtime-repositories "Next" |
| G13 | No CI-bound deployment id (uses `drizzle-${tag}` placeholder) | `createMigrationDeploymentId()` |
| G14 | Missing `_handlers/`, `_context/`, `_policies/`, `_schedules/`, `_subagents/` | Build guide folder tree |
| G15 | Missing RPC: `readBrainContext`, `checkActiveSession` | `brioela.brain.agent.ts` vs build guide |
| G16 | Missing `fetch` override, schedule dispatch, keepAlive/fiber patterns | Build guide DO class sample |
| G17 | No app routes calling Brain by `idFromName(userId)` | Ledger 0001.initial-spine |
| G18 | Memory RPCs do not gate on readiness before serving | `appendMemoryEvent` / `listMemoryEvents` no readiness check |
| G19 | No read-only degraded mode when migration blocked | Build guide readiness table |
| G20 | No historical attempt counting across migration runs | Ledger 0002.runtime-repositories |
| G21 | Table prefix drift: spec `brain_schema_readiness` vs shipped `schema_readiness` | Docs vs `_schemas/schema.readiness.schema.ts` — intentional shorten or doc drift |

# Blocked by

- 01-platform-foundation
- 03-platform-auth-onboarding

# Blocks

- 05-brain-memory-tools (schemas exist; tools depend on foundation RPC)
- 06-brain-skill-tools through 09-brain-alarm-tools (tables + DB)
- 15-brain-system-prompt, 16-brain-session-tools, 20-brain-chat-runtime
- 12-brain-sub-agents (typed parent RPC surface incomplete)

# Sources

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

# Draft count

**69** files in `draft/` — agent, all `_schemas/`, migration runtime, 8 SQL migrations, foundation repos, RPC, manifest tool, wrangler, shared sqlite adapter, tests.
