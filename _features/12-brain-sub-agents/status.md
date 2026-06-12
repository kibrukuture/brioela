# Status

open

**No sub-agent DO classes, spawn handlers, or maintenance-only tools shipped.** Partial foundation: `sessions`/`agent_state` schemas, `SessionKind` enum stub in `get.brain.tools.ts` with wrong permissions, alarm schedule tools (**09**). Feature is not done per full spec.

# Shipped in backend (partial)

- [x] `sessions.session_type` includes `background` + `alarm_type` column — `_schemas/session.schema.ts`
- [x] `agent_state` table — keys for `brain_maintenance.last_run`, `behavior_pattern_detection.last_run` documented in **11** spec
- [x] `sessionKindSchema` — `brain_maintenance`, `behavior_pattern_detection` in `get.brain.tools.ts`
- [x] `TOOL_PERMISSIONS` entries for both kinds — **drift vs spec 15** (G2, G3)
- [x] `schedule_user_alarm` tool — sub-agents will use for self-reschedule (**09**)
- [ ] `_subagents/` directory — zero files
- [ ] `BrainMaintenanceAgent`, `BehaviorPatternAgent`, `SessionContextCompressor` DO classes
- [ ] Maintenance-only tools (`get_skills_for_brain_maintenance`, personality trait writes, `get_memory_events_since`)
- [ ] `check_active_session` RPC
- [ ] Spawn handlers + WAL post-step
- [ ] First-boot alarm seed for maintenance types
- [ ] wrangler DO bindings for child agents
- [ ] Sub-agent tests
- [ ] `BrioelaBrain` typed RPC surface for sub-agent parent calls (G4)

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `_subagents/` folder | `rg _subagents backend` — zero; build-guide `01-do-class-and-setup.md` lists intended tree |
| G2 | `brain_maintenance` tool permissions wrong | Shipped: `write_user_memory`, recipe tools. Spec **15**: skill + personality maintenance reads/writes only |
| G3 | `behavior_pattern_detection` permissions wrong | Shipped: `log_memory_event`, unrestricted `write_user_memory`. Spec **15**: `get_memory_events_since`, pattern-only write |
| G4 | `BrioelaBrain` has no sub-agent RPC | `brioela.brain.agent.ts` — memory RPC only; no `checkActiveSession`, personality/skill maintenance methods |
| G5 | No `BrainMaintenanceAgent` DO | Ledger `07-sub-agents/0001` open |
| G6 | No `BehaviorPatternAgent` DO | Ledger `07-sub-agents/0002` open |
| G7 | No `SessionContextCompressor` DO | Ledger `07-sub-agents/0003` open (obsolete content — prefer **17**) |
| G8 | No spawn handlers | No `spawn.brain.maintenance.handler.ts`; **14** dispatch missing |
| G9 | No maintenance-only executables | `rg get_skills_for_brain_maintenance backend` — zero |
| G10 | Skill tools not shipped | **06** G1–G5 — Pass 1 cannot archive/update skills |
| G11 | No personality trait maintenance writes | No `create/update/archive_personality_trait` executables |
| G12 | No first-boot alarm seed | Init sequence in **15** / **12-schema-version** not implemented in Brain agent |
| G13 | No WAL checkpoint after maintenance | **12-schema-version** — `PRAGMA wal_checkpoint(TRUNCATE)` not called |
| G14 | No `compressor` SessionKind | **17** documents `compressor: []` permissions — not in enum |
| G15 | No `_policies/sub.agent.tool.policy.ts` | Spec **15** caller authorization matrix not enforced |
| G16 | Session open for background rows | **11** G1 — spawn handlers need insert/finalize |
| G17 | Alarm wake not wired | **09** G1 — self-reschedule may not refresh DO slot |
| G18 | wrangler child DO bindings missing | No `BrainMaintenanceAgent` in worker config |
| G19 | `namespace` pattern vs patterns drift | Build-guide uses `patterns.*`; spec **15** uses `pattern.*` — **prefer pattern** |
| G20 | Behavior pattern cadence conflict | **15**: 3 days; build-guide **04** / **05-alarm-system**: 14 days — **prefer 15** |
| G21 | Active-session defer duration conflict | **15**: 1 hour; build-guide **04**: 2 hours for maintenance — **prefer 15** |
| G22 | BehaviorPattern active-session check | **15** requires check; build-guide **04** says pattern agent skips it — **prefer 15** |
| G23 | Maintenance Pass 3 conflict | Build-guide **04**: memory consolidation flags; spec **15**: trait inference — **prefer 15** |
| G24 | Skill stale thresholds partial | **15** vs **02-brain-maintenance-passes** — merge both; mass-archive guard from build-guide |
| G25 | Compression handler split | Ledger **0003** inline handler with wrong schema; **17** DO sub-agent + **0004** orchestration — **prefer 17** |

# Per sub-agent shipped vs open

| Sub-agent | Shipped | Open |
|---|---|---|
| **BrainMaintenanceAgent** | `SessionKind` enum entry; wrong `TOOL_PERMISSIONS` slice | DO class, 3 passes, maintenance tools, spawn handler, WAL step, RPC, wrangler binding, tests |
| **BehaviorPatternAgent** | `SessionKind` enum entry; wrong permissions | DO class, event scan flow, `pattern.*` write enforcement, spawn handler, `last_run` agent_state, tests |
| **SessionContextCompressor** | Nothing | DO class, Haiku handler, system prompt, four-field schema (**13**), integration hook for **13** |

# 12 vs neighbor boundaries

| In **12** (this feature) | In separate feature |
|---|---|
| Sub-agent DO classes + prompts + pass logic | `dispatch.alarm.handler.ts` router — **14** |
| Spawn handlers (maintenance + pattern) | `openSession` / `closeSession` generic — **11** |
| Maintenance-only read/write tools + RPC | Skill CRUD tools — **06** |
| `check_active_session` | Session active guard repos — **11** |
| First-boot seed for two alarm types | DO migration init runtime — **04** |
| WAL TRUNCATE after maintenance | WAL PRAGMA at startup — **04** / **12-schema-version** |
| SessionContextCompressor DO + prompt | Thresholds + `applyCompression` — **13** |
| Background session row semantics | Full session lifecycle — **11** |
| Self-reschedule via `schedule_user_alarm` | Alarm tool + wake — **09** |
| **HealthInsightAgent** | **22-health-intelligence** |
| **recall_check** handler | **31-recall-alerts** / Path B (**09** spec) |

# Blocked by

- 04-brain-foundation (schemas — shipped)
- 05-brain-memory-tools (write path — shipped)
- 06-brain-skill-tools (Pass 1 — open)
- 09-brain-alarm-tools (schedule — shipped; wake open)
- 11-brain-sessions-lifecycle (background session helpers — open)

# Blocks

- 13-brain-session-compression (compressor DO)
- 14-brain-alarm-dispatch (spawn entry points)
- 19-brain-tool-registry (full permission matrix)

# Obsolete ledger entries

| Ledger | Issue |
|---|---|
| `brain/07-sub-agents/0003.session-context-compressor.md` | Wrong summary fields (`topics/open_items/...`); marks session `completed` not `compressed`; `sessionType: 'general'` invalid; inline-only — **superseded by 17 + 0004** |
| `brain/06-alarm-system/0001.alarm-dispatch.md` | Uses status `'fired'` — not in schema; use `completed` |
| `brain/03-tool-protocol/implementation/0006.session-tools.md` | Wrong FTS target, `general` session kind — **16** supersedes |

# Ambiguous / conflicting sources

1. **Pattern cadence:** `15-brain-maintenance-and-behavior-patterns.md` + `12-schema-version.md` = **3 days**. `build-guide/05-brain/04-sub-agents.md` + `05-alarm-system.md` + `02-brain-maintenance-passes.md` = **14 days**. **Prefer 15.**
2. **Maintenance idle defer:** Spec **15** = reschedule **1 hour** when active session. Build-guide **04** = **2 hours** when recent active session. **Prefer 15** for both agents.
3. **Pattern agent active-session check:** Spec **15** = mandatory defer. Build-guide **04** = "does not check for active sessions". **Prefer 15.**
4. **Pattern namespace:** Spec **15** + `02-tool-protocol` = `pattern.*`. Build-guide **04** + **06-brain-memory/02** = `patterns.*`. **Prefer `pattern.*`.**
5. **Maintenance Pass 3:** Build-guide **04** = memory contradiction flags to `system.brain_maintenance_flags`. Spec **15** = personality trait inference LLM pass. **Prefer 15.**
6. **TOOL_PERMISSIONS:** Spec **15** full matrix vs shipped `get.brain.tools.ts` — **prefer 15**; maintenance reads via RPC not live session registry.
7. **SessionContextCompressor shape:** Ledger **0003** = one-shot function, wrong schema. Spec **17** = ephemeral DO, `intent/accomplished/decisions/continuing`. **Prefer 17.**
8. **Compressor ownership split:** Ledger **0003** tagged sub-agent; **0004** tagged session lifecycle. **12** = DO + prompt; **13** = thresholds + applyCompression.
9. **recall_check in alarm table:** `05-alarm-system.md` lists as scheduled alarm; **09-brain-alarm-tools/spec** = Path B not `scheduled_alarms`. **Not a sub-agent — exclude from 12.**
10. **brioela-specs/17-behavioral-food-pattern-detection.md** vs implementable **15:** product tables vs `user_memory` pattern namespace — **12 implements 15**; product tables are future reconciliation.

# Sources

- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/03-user-personality.md`
- `implementable-specs/11-agent-state.md`
- `implementable-specs/12-schema-version.md`
- `implementable-specs/10-scheduled-alarms.md`
- `build-guide/05-brain/04-sub-agents.md`
- `build-guide/05-brain/01-do-class-and-setup.md`
- `build-guide/05-brain/05-alarm-system.md`
- `build-guide/06-brain-memory/02-brain-maintenance-passes.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md`
- `build-guide/29-health-intelligence/03-health-insight-agent.md` (boundary — feature 22)
- `_records/implementation-ledger/brain/07-sub-agents/`
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md`
- `_records/implementation-ledger/brain/06-alarm-system/0001.alarm-dispatch.md`
- `_features/06-brain-skill-tools/status.md`
- `_features/09-brain-alarm-tools/status.md`
- `_features/11-brain-sessions-lifecycle/status.md`
- `_features/13-brain-session-compression/status.md`

# Draft count

**18** files in `draft/` — 1 production snapshot (partial `get.brain.tools.ts`) + 17 gap/intended snapshots (3 DO agents, handlers, tools, prompts, init, policy).
