# Brain Foundation — Build

Feature **06**. Production paths under `backend/src/agents/brain/` plus shared SQLite adapter and manifest tool.

---

## Package scripts (`backend/package.json`)

| Script | Role |
|---|---|
| `brain:typecheck` | `tsc -p brain.typecheck.config.json` |
| `brain:test:typecheck` | test tsconfig |
| `brain:test` | Vitest + `@cloudflare/vitest-pool-workers` on `src/agents/brain/**/*.test.ts` |
| `brain:db:generate` | `drizzle-kit generate` + `brain:db:manifest:generate` |
| `brain:db:check` | `drizzle-kit check` + manifest check |
| `brain:db:manifest:generate` | regen `brain.migration.ts` |
| `brain:db:manifest:check` | verify bundle matches drizzle journal |

Drizzle config: `backend/brain.drizzle.config.ts` → schema `./src/agents/brain/_schemas/index.ts`, out `./src/agents/brain/drizzle`, driver `durable-sqlite`.

---

## Wrangler (`backend/wrangler.jsonc`)

```jsonc
"durable_objects": {
  "bindings": [{ "name": "BRIOELA_BRAIN", "class_name": "BrioelaBrain" }]
},
"migrations": [{
  "tag": "brioela_brain_v1",
  "new_sqlite_classes": ["BrioelaBrain"]
}]
```

Worker export: `backend/src/index.ts` re-exports `BrioelaBrain`.

Test worker: `backend/src/agents/brain/test.worker.ts` exports class for Vitest pool.

---

## Agent class

| File | Role |
|---|---|
| `brioela.brain.agent.ts` | `BrioelaBrain` — DB create, `blockConcurrencyWhile` → `runMigrations`, 3 `@callable()` methods |
| `index.ts` | barrel export |

---

## Database adapter

| File | Role |
|---|---|
| `_database/create.database.helper.ts` | `drizzle(storage, { schema })` |
| `_database/index.ts` | exports `createDatabase`, `BrainDatabase` type |

Shared migrator wrapper (approved raw boundary):

| File | Role |
|---|---|
| `backend/src/database/sqlite/_migrations/apply.durable.sqlite.migration.helper.ts` | `migrate()` from `drizzle-orm/durable-sqlite/migrator` |
| `backend/src/database/sqlite/_database/durable.sqlite.database.ts` | shared drizzle helper |
| `backend/src/database/sqlite/_migrations/index.ts` | export |

---

## Schemas (`_schemas/`)

All Drizzle table definitions + CHECK constraints. Barrel: `index.ts`.

| File | Table(s) |
|---|---|
| `agent.state.schema.ts` | `agent_state` |
| `memory.event.schema.ts` | `memory_event` |
| `user.memory.schema.ts` | `user_memory` |
| `user.personality.schema.ts` | `user_personality` |
| `skill.schema.ts` | `skills` |
| `skill.version.schema.ts` | `skill_versions` |
| `constraint.schema.ts` | `constraints` |
| `session.schema.ts` | `sessions` |
| `session.turn.schema.ts` | `session_turns` |
| `recipe.schema.ts` | `recipes` |
| `recipe.version.schema.ts` | `recipe_versions` |
| `recipe.origin.schema.ts` | Zod origin enum (write boundary, not SQL enum) |
| `normalized.recipe.content.schema.ts` | content shape helper |
| `scheduled.alarm.schema.ts` | `scheduled_alarms` |
| `schema.readiness.schema.ts` | `schema_readiness` |
| `migration.run.schema.ts` | `migration_runs` |
| `migration.smoke.schema.ts` | `migration_smoke_results` |

**Note:** Feature 07 also documents `memory_event` + `user_memory` schemas in its draft folder. Canonical owner for all tables is **06**.

---

## Drizzle SQL (`drizzle/`)

| File | Content |
|---|---|
| `0000_rapid_rachel_grey.sql` | Initial CREATE TABLE + indexes for all product tables |
| `0001_add_fts_and_triggers.sql` | FTS5 virtual tables + sync triggers (custom) |
| `0002_sad_dragon_man.sql` | skill_versions column expand |
| `0003_next_rafael_vega.sql` | drop legacy `reason` column |
| `0004_rename_recipes_source_session_id.sql` | recipe column rename |
| `0005_recipe_versions_and_title_sync.sql` | recipe_versions table + title CHECK |
| `0006_recipe_origin_naming.sql` | origin / session_id / link_url renames |
| `0007_scheduled_alarms_triggering_session_id.sql` | alarm column + index |
| `meta/_journal.json` | Drizzle journal (source for manifest) |

Generated bundle (do not hand-edit):

| File | Role |
|---|---|
| `_migrations/brain.migration.ts` | journal + inlined SQL strings for Worker bundle |

---

## Migration runtime (`_migrations/`)

| File | Role |
|---|---|
| `run.migrations.handler.ts` | Main startup: Drizzle apply → lock → runs → smoke → readiness |
| `run.migration.smoke.handler.ts` | Single `memory.write` smoke path |
| `read.current.migration.helper.ts` | Latest journal entry |
| `format.migration.error.helper.ts` | JSON error for runs/readiness |
| `migration.schema.ts` | Bundle types, lock Zod, readiness type |
| `index.ts` | exports |
| `run.migrations.handler.test.ts` | 4 Workers tests (boot, idempotent, lock, FTS) |

---

## Repositories (foundation-owned subset)

Full barrel exports more repos for downstream features. Foundation directly uses:

| File | Role |
|---|---|
| `migration.lock.repository.ts` | `agent_state.schema.migration_lock` CAS |
| `write.migration.run.repository.ts` | run lifecycle rows |
| `write.migration.smoke.repository.ts` | smoke result rows |
| `write.schema.readiness.repository.ts` | readiness singleton upsert |
| `read.schema.readiness.repository.ts` | readiness read |
| `write.memory.event.once.repository.ts` | idempotent smoke insert |
| `list.memory.events.repository.ts` | smoke read verification |

Other repos in `_repositories/index.ts` belong to tool features (07–11) but share the same database instance.

---

## RPC types (`_rpc/`)

| File | Role |
|---|---|
| `memory.rpc.ts` | Zod + types for append/list (used by Agent + feature 07) |
| `readiness.rpc.ts` | `CheckedBrainReadiness` wrapper type |
| `index.ts` | barrel |

---

## Error types (`_types/`)

| File | Role |
|---|---|
| `brain.migration.error.type.ts` | `BrainMigrationLockedError` |
| `brain.readiness.error.type.ts` | `BrainReadinessUnavailableError` |
| `index.ts` | barrel (also re-exports memory types for 07) |

---

## Manifest tool (`tools/brioela-brain-migration-manifest/`)

| File | Role |
|---|---|
| `generate.brain.migration.manifest.handler.ts` | CLI: journal → `brain.migration.ts` |
| `check.brain.migration.manifest.handler.ts` | CI check |
| `_helpers/create.brain.migration.manifest.helper.ts` | string bundler |
| `_helpers/read.brain.migration.journal.helper.ts` | read `meta/_journal.json` |
| `_helpers/brain.migration.manifest.paths.helper.ts` | paths |
| `_helpers/workspace.root.helper.ts` | `BRIOELA_WORKSPACE_ROOT` |
| `_types/brain.migration.manifest.error.type.ts` | errors |

---

## Tests

| File | Coverage |
|---|---|
| `_migrations/run.migrations.handler.test.ts` | ready boot, idempotent rerun, live lock → needs_retry, FTS trigger sync |
| `test.env.d.ts` | `BRIOELA_BRAIN` typing for Vitest |
| `test.worker.ts` | DO export for test pool |

Feature 07 adds `memory.tool.test.ts`. Recipe/alarm tool tests also boot Brain via same binding.

---

## Not in this feature folder (future)

```text
_handlers/
_context/
_policies/
_schedules/
_subagents/
_tools/                    → 07–11
_mappers/                  → mostly 07
brain.drizzle.config.ts    → referenced above (config, not runtime)
```

---

## Draft folder

`draft/` contains one `.md` per production file listed above (schemas, migrations, SQL, agent, repos, RPC, manifest tool, wrangler excerpt). See file count in `status.md`.
