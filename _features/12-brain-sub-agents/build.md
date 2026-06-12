# Brain Sub-Agents — Build

Feature **12**. Production paths under `backend/src/agents/brain/` plus sibling DO registrations in wrangler.

---

## Shipped today

| Area | Status |
|---|---|
| `sessions` schema supports `background` + `alarm_type` | ✓ (**04** / **11**) |
| `agent_state` schema for `*_last_run` keys | ✓ (**04**) |
| `sessionKindSchema` includes `brain_maintenance`, `behavior_pattern_detection` | ✓ (partial — `get.brain.tools.ts`) |
| `TOOL_PERMISSIONS` stub for maintenance kinds | ✓ (drift vs spec 15 — see G2, G3) |
| `schedule_user_alarm` / `cancel_user_alarm` tools | ✓ (**09** — wake G1 open) |
| Memory + recipe tools maintenance incorrectly listed | ✓ shipped but wrong for maintenance |
| `_subagents/` folder | ✗ |
| `BrainMaintenanceAgent` DO class | ✗ |
| `BehaviorPatternAgent` DO class | ✗ |
| `SessionContextCompressor` DO class | ✗ |
| Maintenance-only read/write tools | ✗ |
| `check_active_session` RPC | ✗ |
| Spawn handlers + alarm cases | ✗ (**14** owns dispatch router) |
| First-boot alarm seed for maintenance types | ✗ |
| WAL checkpoint after maintenance | ✗ |
| Sub-agent unit tests | ✗ |
| wrangler DO bindings for child agents | ✗ |

**No sub-agent production code exists.** Only partial tool-registry kinds and alarm tools that sub-agents will call.

---

## File manifest

### Sub-agent DO classes (12 core)

| File | Role |
|---|---|
| `_subagents/brain-maintenance/brain.maintenance.agent.ts` | `BrainMaintenanceAgent` — `@callable() runMaintenancePass` |
| `_subagents/brain-maintenance/run.maintenance.pass.handler.ts` | Three-pass orchestration (rules + LLM sub-calls) |
| `_subagents/brain-maintenance/brain.maintenance.system.prompt.ts` | System prompt constants |
| `_subagents/brain-maintenance/index.ts` | Barrel export |
| `_subagents/behavior-pattern/behavior.pattern.agent.ts` | `BehaviorPatternAgent` — `@callable() runBehaviorPatternPass` |
| `_subagents/behavior-pattern/run.behavior.pattern.pass.handler.ts` | Event scan + LLM + pattern writes |
| `_subagents/behavior-pattern/behavior.pattern.system.prompt.ts` | System prompt constants |
| `_subagents/behavior-pattern/index.ts` | Barrel export |
| `_subagents/session-context-compressor/session.context.compressor.agent.ts` | `SessionContextCompressor` — `@callable() compressContext` |
| `_subagents/session-context-compressor/compress.session.context.handler.ts` | Haiku call + Zod parse → `CompressionSummary` |
| `_subagents/session-context-compressor/session.context.compressor.system.prompt.ts` | Compressor prompt (**17**) |
| `_subagents/session-context-compressor/index.ts` | Barrel export |
| `_subagents/index.ts` | Re-export all child agents |

### Tool wrapper helpers (AI SDK → Brain RPC)

| File | Role |
|---|---|
| `_subagents/brain-maintenance/_helpers/build.brain.maintenance.tools.helper.ts` | `tool()` wrappers calling typed Brain RPC |
| `_subagents/behavior-pattern/_helpers/build.behavior.pattern.tools.helper.ts` | Pattern write + read wrappers |

### Spawn / integration handlers

| File | Role | Owner note |
|---|---|---|
| `_handlers/spawn.brain.maintenance.handler.ts` | Active-session guard, open background session, `subAgent()`, finalize, WAL checkpoint, reschedule | **12** |
| `_handlers/spawn.behavior.pattern.handler.ts` | Same pattern for behavior pass | **12** |
| `_handlers/initialize.brain.sub.agent.alarms.handler.ts` | First-boot seed `brain_maintenance_run` + `behavior_pattern_detection` | **12** (called from init) |
| `_handlers/dispatch.alarm.handler.ts` | Routes alarm types to spawn handlers | **14** — cases wired here |
| `_handlers/compress.session.handler.ts` | Threshold check + `subAgent(SessionContextCompressor)` + `applyCompression` | **13** orchestration; **12** owns compressor DO |

### Maintenance-only tools / RPC (not in chat `getBrainTools`)

| File | Role |
|---|---|
| `_tools/_executables/get.skills.for.brain.maintenance.executable.ts` | Read user skills, no counter side effects |
| `_tools/_executables/get.personality.traits.for.brain.maintenance.executable.ts` | Read all traits |
| `_tools/_executables/get.user.memory.for.brain.maintenance.executable.ts` | Read by ids/namespace, no read_count |
| `_tools/_executables/get.memory.events.since.executable.ts` | Cursor scan for pattern agent |
| `_tools/_executables/update.personality.trait.executable.ts` | Trait revision |
| `_tools/_executables/archive.personality.trait.executable.ts` | Deactivate trait |
| `_tools/_executables/create.personality.trait.executable.ts` | New trait insert |
| `_rpc/check.active.session.rpc.ts` | `{ has_active_session, session_id? }` |
| `_policies/sub.agent.tool.policy.ts` | Caller → allowed tool map (**15** matrix) |

Matching `_schemas/` + thin `.tool.ts` only if exposing through AI SDK inside sub-agent; otherwise RPC-only.

### Schemas

| File | Role | Owner |
|---|---|---|
| `_schemas/compression.summary.schema.ts` | Four-field Zod schema | **13** defines; **12** compressor consumes |

### Registration / wrangler

| File | Change |
|---|---|
| `backend/wrangler.jsonc` (or worker config) | Register `BrainMaintenanceAgent`, `BehaviorPatternAgent`, `SessionContextCompressor` DO bindings |
| `_tools/get.brain.tools.ts` | Fix `TOOL_PERMISSIONS` drift; add `compressor: []` when **19** extends enum |
| `brioela.brain.agent.ts` | `@callable()` RPC methods sub-agents call; `subAgent()` spawn helpers |

---

## Spawn handler contracts

### `spawnBrainMaintenance(database, brain, userId, wake)`

1. `checkActiveSession` — if active → reschedule `brain_maintenance_run` +1h, return deferred.
2. `runId = createId()`; `openSession` equivalent: insert `background` row, `alarm_type: brain_maintenance_run`.
3. `subAgent(BrainMaintenanceAgent, \`brain-maintenance-${userId}-${runId}\`)`.
4. `await agent.runMaintenancePass({ userId, runId })`.
5. Finalize session row with tokens + outcome summary.
6. `PRAGMA wal_checkpoint(TRUNCATE)` — log to `agent_state` `brain_maintenance.last_checkpoint`.
7. Update `brain_maintenance.last_run` in `agent_state`.
8. `schedule_user_alarm({ alarm_type: brain_maintenance_run, scheduled_at: now + 7d })`.
9. Refresh wake slot if `wake` provided.

### `spawnBehaviorPattern(database, brain, userId, wake)`

Same guard + session pattern. On success: update `behavior_pattern_detection.last_run`, reschedule +3d.

### `SessionContextCompressor.compressContext({ turns, sessionType })`

1. Build transcript from turns ordered by `turn_number`.
2. `generateObject` or `generateText` + Zod parse with `compressionSummarySchema`.
3. Return `CompressionSummary` — **no DB writes** (caller **13** applies).

---

## wrangler DO registration (to add)

```jsonc
// Illustrative — exact binding names follow project convention
{
  "durable_objects": {
    "bindings": [
      { "name": "BRAIN_MAINTENANCE_AGENT", "class_name": "BrainMaintenanceAgent" },
      { "name": "BEHAVIOR_PATTERN_AGENT", "class_name": "BehaviorPatternAgent" },
      { "name": "SESSION_CONTEXT_COMPRESSOR", "class_name": "SessionContextCompressor" }
    ]
  }
}
```

Export classes from `backend/src/agents/brain/index.ts` or dedicated entrypoints per wrangler pattern.

---

## Acceptance criteria

1. Three DO classes exist under `_subagents/` with `@callable()` entry methods.
2. `BrainMaintenanceAgent` runs three passes in order; never writes forbidden tables.
3. `BehaviorPatternAgent` writes only `pattern.*` namespace; never touches `user_personality`.
4. `SessionContextCompressor` returns valid four-field JSON; calls zero tools.
5. Maintenance-only read tools have no `use_count` / `read_count` side effects.
6. `check_active_session` defers both alarm agents when any `active` session exists.
7. Spawn handlers create/finalize `background` session rows with correct `alarm_type`.
8. First-boot init seeds both recurring alarms when no pending row exists.
9. WAL TRUNCATE checkpoint runs after successful maintenance; result logged to `agent_state`.
10. All permanent writes go through Brain RPC — child agents do not import `_schemas/`.
11. `get.brain.tools.ts` maintenance kinds align with spec **15** OR maintenance uses RPC-only path documented in code.
12. Unit tests: active-session defer; pattern namespace rejection; compressor schema parse; idempotent re-archive.
13. `bun run verify` passes after add.
14. **14** dispatch cases call spawn handlers — not required to mark **12** shipped if spawn handlers + DO classes work via direct test invocation.

Do **not** mark **12** `shipped` until all three sub-agent DO classes exist, maintenance-only tools/RPC work, and spawn handlers integrate with session + alarm contracts.

---

## Verification commands

```sh
cd backend && bun run brain:typecheck
cd backend && bunx vitest run src/agents/brain/_subagents/brain-maintenance/
cd backend && bunx vitest run src/agents/brain/_subagents/behavior-pattern/
cd backend && bunx vitest run src/agents/brain/_subagents/session-context-compressor/
cd backend && bunx vitest run src/agents/brain/_handlers/spawn.brain.maintenance.handler.test.ts
cd backend && bun run verify
```

---

## Blocked by

- **04-brain-foundation** — schemas, migration runtime (shipped)
- **05-brain-memory-tools** — `write_user_memory` executable (shipped)
- **06-brain-skill-tools** — `update_user_skill`, `archive_user_skill` (open — Pass 1 blocked)
- **07-brain-constraint-tools** — not consumed by maintenance (no block)
- **09-brain-alarm-tools** — schedule tool (shipped; wake G1 open)
- **11-brain-sessions-lifecycle** — background session open/finalize helpers (open)

## Blocks

- **13-brain-session-compression** — needs SessionContextCompressor DO
- **14-brain-alarm-dispatch** — needs spawn handlers for two alarm types
- **15-brain-system-prompt** — may reference maintenance outcomes indirectly
- **19-brain-tool-registry** — full SessionKind matrix + `compressor` kind

---

## Draft folder

See `status.md` for gap list and draft count.

---

## Sources

- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/03-user-personality.md`
- `implementable-specs/11-agent-state.md`
- `implementable-specs/12-schema-version.md`
- `build-guide/05-brain/04-sub-agents.md`
- `build-guide/05-brain/01-do-class-and-setup.md`
- `build-guide/06-brain-memory/02-brain-maintenance-passes.md`
- `_records/implementation-ledger/brain/07-sub-agents/`
