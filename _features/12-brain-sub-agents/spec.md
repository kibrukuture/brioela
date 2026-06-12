# Brain Sub-Agents — Spec

Feature **12**. Three Brain-owned **child agents** — ephemeral Durable Objects spawned by `BrioelaBrain`, each with a dedicated system prompt, tool/capability subset, background `sessions` row, and typed parent RPC boundary. Permanent user truth stays in Brain SQLite; sub-agents reason and propose writes; Brain validates and executes.

**Not in this feature:** compression **thresholds/triggers** and `checkCompressionNeeded` (**13-brain-session-compression**); alarm **dispatch router** and DO wake wiring (**14-brain-alarm-dispatch**); session **open/close** lifecycle (**11-brain-sessions-lifecycle**); `schedule_user_alarm` / `cancel_user_alarm` tool implementation (**09-brain-alarm-tools**); skill CRUD tools maintenance consumes (**06-brain-skill-tools**); Health Insight Agent (**22-health-intelligence**); `recall_check` alarm handler (**31-recall-alerts** / Path B per **09**); live chat turn loop (**20-brain-chat-runtime**).

---

## Purpose

Long-running user brains accumulate stale skills, decaying personality traits, raw behavioral events, and oversized session transcripts. Three background agents keep derived state accurate without interrupting live sessions:

| Sub-agent | Alarm type | Cadence (authoritative) | Primary output |
|---|---|---|---|
| **BrainMaintenanceAgent** | `brain_maintenance_run` | Every **7 days** | Clean skills, decayed/revised traits, new inferred traits, WAL checkpoint |
| **BehaviorPatternAgent** | `behavior_pattern_detection` | Every **3 days** | `user_memory` entries in `pattern.*` namespace |
| **SessionContextCompressor** | *(inline — no alarm)* | On compression trigger (**13**) | Four-field JSON summary → continuation session |

Neither maintenance agent is user-facing. SessionContextCompressor runs mid-session when thresholds fire; the user should not notice compression.

---

## Architecture — Brain-owned child agents

All agents are Cloudflare Durable Objects. Separation is by **ID key**:

```text
BrioelaBrain
  key: idFromName(userId)          ← PERMANENT
  owns: SQLite (user brain)
  │
  ├── brain_maintenance_run alarm [14 dispatches]
  │     → subAgent(BrainMaintenanceAgent, `brain-maintenance-${userId}-${runId}`)
  │     → background session row (alarmType: brain_maintenance_run)
  │     → dies when pass completes
  │
  ├── behavior_pattern_detection alarm [14 dispatches]
  │     → subAgent(BehaviorPatternAgent, `behavior-pattern-${userId}-${runId}`)
  │     → background session row (alarmType: behavior_pattern_detection)
  │     → dies when pass completes
  │
  └── compression trigger [13 calls handler]
        → subAgent(SessionContextCompressor, `compressor_${userId}_${sessionId}`)
        → NO tool calls — turns passed in, summary returned
        → Brain applyCompression [13] marks old session compressed, opens child session
        → dies when summary returned
```

**Typed Brain RPC:** Sub-agents never import Brain `_schemas/` or open Brain SQLite. They call `@callable()` methods on `BrioelaBrain` via `parentAgent<BrioelaBrain>()`. Brain validates Zod input, enforces caller policy in `_policies/`, executes handler/tool, returns typed result.

**Tools defined once, executed once — always in the Brain.**

Custom `/internal/tool-call` HTTP forwarding is fallback only for external boundaries (`build-guide/05-brain/04-sub-agents.md`, `07-agent-framework-hardening.md`).

---

## SessionKind ↔ DB mapping

Tool registry uses maintenance kinds; SQLite `sessions.session_type` uses `background`:

| `SessionKind` (tools / spawn) | DB `session_type` | Typical `alarm_type` on row |
|---|---|---|
| `brain_maintenance` | `background` | `brain_maintenance_run` |
| `behavior_pattern_detection` | `background` | `behavior_pattern_detection` |
| *(compressor — no SessionKind in shipped registry)* | inherits parent (`chat` / `cooking`) on continuation | null on new row |

Source: `get.brain.tools.ts` (partial), `implementable-specs/07-sessions.md`, `15-brain-maintenance-and-behavior-patterns.md`.

---

## Cross-cutting contracts

### Active session guard (maintenance + pattern agents)

**First step** after spin-up — both agents call `check_active_session` (Brain internal query: `SELECT id FROM sessions WHERE status = 'active' LIMIT 1`).

If `has_active_session`:
1. Reschedule same alarm type **1 hour** later via `schedule_user_alarm`
2. Return `{ deferred: true, reason: 'active_session' }`
3. Do not mutate user data

Source: `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`.

### Background session tracking

Before sub-agent spin-up, Brain inserts `sessions` row:

- `session_type: 'background'`
- `alarm_type`: matching alarm type string
- `status: 'active'`
- `model`: e.g. `claude-sonnet-4-6` (maintenance/pattern); compressor uses `claude-haiku-4-5-20251001` (**17**)
- Token counters zeroed

After sub-agent completes, Brain updates row:

- `status: 'completed'`
- `outcome_summary`: agent-written summary string
- `input_tokens`, `output_tokens`: from sub-agent run
- `ended_at`, `end_reason: 'completed'`

Source: `15-brain-maintenance-and-behavior-patterns.md`.

### Self-rescheduling

At successful run end, each alarm-driven agent calls `schedule_user_alarm`:

- BrainMaintenanceAgent → next `brain_maintenance_run` at `now + 7 days`
- BehaviorPatternAgent → next `behavior_pattern_detection` at `now + 3 days`

Payload: `{}`. `triggering_session_id: null` (system-scheduled).

### First-boot alarm seeding

On DO initialization (`do.initialized` transition), if no pending row exists for each type, Brain inserts:

- `brain_maintenance_run` — `scheduled_at: now + 7 days`
- `behavior_pattern_detection` — `scheduled_at: now + 3 days`

Then `readEarliestPendingScheduledAt` → `scheduleAlarm`.

Sources: `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`, `implementable-specs/12-schema-version.md` (step 3 init sequence).

### Failure handling

- Alarm row stays `processing` on mid-pass failure; **14** retries with `attempts` increment (max **3**, then `failed`).
- BrainMaintenanceAgent passes are idempotent (re-archive errors handled gracefully).
- BehaviorPatternAgent: `behavior_pattern_detection.last_run` in `agent_state` **not** updated on failure — next run re-scans from same window.

Sources: `15-brain-maintenance-and-behavior-patterns.md`, `implementable-specs/11-agent-state.md`.

### WAL checkpoint (BrainMaintenanceAgent post-step)

After all maintenance passes complete, Brain runs `PRAGMA wal_checkpoint(TRUNCATE)` and logs result to `agent_state` key `brain_maintenance.last_checkpoint`.

Source: `implementable-specs/12-schema-version.md` — not a separate sub-agent; last step of maintenance dispatch path owned by **12**.

---

## Sub-agent 1 — BrainMaintenanceAgent

### Sources read

- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` (authoritative)
- `implementable-specs/03-user-personality.md` (decay rules)
- `implementable-specs/04-skills.md` (tags metadata)
- `implementable-specs/11-agent-state.md` (`brain_maintenance.last_run`, anomaly keys)
- `implementable-specs/12-schema-version.md` (WAL checkpoint)
- `build-guide/05-brain/04-sub-agents.md`
- `build-guide/06-brain-memory/02-brain-maintenance-passes.md`
- `_records/implementation-ledger/brain/07-sub-agents/0001.brain-maintenance-agent.md`

### Identity

Ephemeral DO class under `backend/src/agents/brain/_subagents/brain-maintenance/`. Callable entry: `runMaintenancePass({ userId, runId })`. Model: `claude-haiku-4-5-20251001` for LLM sub-calls per build-guide; Sonnet acceptable for orchestration layer per session row default.

### Three sequential passes

Order is fixed: Pass 1 → Pass 2 → Pass 3.

#### Pass 1 — Skill maintenance

1. `get_skills_for_brain_maintenance` — all `source = 'user'` skills, no side effects on `use_count`.
2. Rule-based stale/archive (no LLM):

| Condition | Action |
|---|---|
| `use_count < 3` AND `last_used_at < now - 30d` AND `status = 'active'` | Mark stale via `update_user_skill` |
| `status = 'stale'` AND idle > 60d | `archive_user_skill` |
| `use_count = 0` AND `last_used_at IS NULL` AND `created_at < now - 14d` | Archive — never used |
| `version > 5` AND `use_count < 2` | Flag for LLM overlap review |

3. LLM overlap sub-call on tag groups with 2+ active skills → archive redundant skill.

**Mass archive guard** (build-guide): if >5 archives in one run, pause, write `brain_maintenance.anomaly.{runId}` to `agent_state`, archive 5 least-used only.

**Hard boundaries:** never touch `source = 'system'` skills; never `create_user_skill`.

#### Pass 2 — Personality trait decay

1. `get_personality_traits_for_brain_maintenance` — all traits including inactive.
2. Rule-based decay per `03-user-personality.md`:
   - Passive: **-0.03** per 30 days without reinforcement
   - Supporting evidence: **+0.05** per new entry (cap +0.15/run in build-guide)
   - Contradicting evidence: **-0.10** per entry
   - Dead evidence (deactivated user_memory): **-0.05** each
3. If strength **< 0.15** → `archive_personality_trait`
4. Else if strength changed → `update_personality_trait`

Build-guide Pass 2 adds reinforcement for traits with `evidence_count >= 5` active 90+ days (+0.05). **Prefer 03 + 15** for decay math; reinforcement is additive from build-guide when evidence supports it.

#### Pass 3 — Personality trait inference (LLM)

1. Load all `user_memory` via `get_user_memory_for_brain_maintenance`
2. Load existing traits — dedupe by name
3. LLM sub-call: propose traits with **3+** distinct evidence IDs, strength **0.4–0.7** initial, never duplicate active traits
4. Apply: `create_personality_trait` or reactivate deactivated trait via `update_personality_trait`

**NOT** build-guide Pass 3 "memory consolidation flags" — **prefer implementable spec 15** trait inference.

### Authorized capabilities (spec 15)

```text
Read:  get_skills_for_brain_maintenance
       get_personality_traits_for_brain_maintenance
       get_user_memory_for_brain_maintenance
Write: update_user_skill, archive_user_skill, schedule_user_alarm
       update_personality_trait, archive_personality_trait, create_personality_trait
```

**Cannot:** write `user_memory`, `constraints`, `recipes`, `memory_event`; `create_user_skill`.

### Shipped permission drift

Production `get.brain.tools.ts` lists `write_user_memory`, `update_user_recipe`, `archive_user_recipe` for `brain_maintenance` — **wrong vs spec 15**. See `status.md` G2.

---

## Sub-agent 2 — BehaviorPatternAgent

### Sources read

- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` (authoritative)
- `implementable-specs/02-user-memory.md` (namespace rules)
- `implementable-specs/01-memory-event.md`
- `implementable-specs/11-agent-state.md` (`behavior_pattern_detection.last_run`)
- `build-guide/05-brain/04-sub-agents.md`
- `build-guide/06-brain-memory/02-brain-maintenance-passes.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md` (product vision — separate tables not in implementable spine; pattern output goes to `user_memory` per 15)
- `_records/implementation-ledger/brain/07-sub-agents/0002.behavior-pattern-agent.md`

### Identity

Ephemeral DO under `_subagents/behavior-pattern/`. Callable: `runBehaviorPatternPass({ userId, runId })`.

### Data chain

```text
memory_event → BehaviorPatternAgent → user_memory (pattern.*)
                                              ↓
                               BrainMaintenanceAgent Pass 3 → user_personality
```

BehaviorPatternAgent **never** writes `user_personality` directly.

### Flow

1. **Active session guard** (same as maintenance — defer 1h)
2. Read `behavior_pattern_detection.last_run` from `agent_state`; default window **7 days** if unset
3. `get_memory_events_since({ since_timestamp, limit: 500 })` — `has_more` noted in outcome, never unbounded
4. Context: existing traits + `get_user_memory_for_brain_maintenance({ namespace: 'pattern' })`
5. LLM behavior pattern detection sub-call
6. Write patterns with `confidence >= 0.6` via `write_user_memory` — **namespace `pattern` only** (Zod prefix enforced)
7. Update `behavior_pattern_detection.last_run` in `agent_state`
8. Reschedule `behavior_pattern_detection` at `now + 3 days`

### Authorized capabilities (spec 15)

```text
Read:  get_memory_events_since
       get_personality_traits_for_brain_maintenance
       get_user_memory_for_brain_maintenance
Write: write_user_memory (pattern.* only)
       schedule_user_alarm
```

**Cannot:** skills, constraints, recipes, `user_personality`, namespaces outside `pattern.*`.

### Shipped permission drift

Production grants `log_memory_event` + unrestricted `write_user_memory` — missing maintenance read tools; namespace enforcement not verified. See `status.md` G3.

---

## Sub-agent 3 — SessionContextCompressor

### Sources read

- `implementable-specs/17-session-lifecycle.md` Part 1 (authoritative for prompt + schema)
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/04-sub-agents.md` (folder layout)
- `build-guide/05-brain/01-do-class-and-setup.md` (`_subagents/session-context-compressor/`)
- `_records/implementation-ledger/brain/07-sub-agents/0003.session-context-compressor.md` (**obsolete fields — see status**)
- `_records/implementation-ledger/brain/05-session-lifecycle/0004.session-compression.md` (**13** handler scope)

### Identity

Ephemeral DO under `_subagents/session-context-compressor/`. Key: `compressor_${userId}_${sessionId}`.

**Architectural difference:** no tool forwarding. Brain collects turns, passes transcript, receives structured JSON.

### Model and output

- Model: `claude-haiku-4-5-20251001`
- Output schema (**17** — not ledger 0003):

```typescript
{
  intent:       string  // ≤500 chars
  accomplished: string  // ≤1000 chars
  decisions:    string  // ≤500 chars
  continuing:   string  // ≤500 chars
}
```

Stored in old session `outcome_summary` as JSON when `status = 'compressed'`.

### System prompt (summary)

Compressor reads all turns; produces user-specific four-field summary for conversational continuity; tight field limits; valid JSON only.

Full prompt: `implementable-specs/17-session-lifecycle.md` lines 103–124.

### Tool permissions

```typescript
compressor: []  // no tools — pure reasoning
```

Not yet in shipped `SessionKind` enum — **19** registry gap.

### 12 vs 13 split

| **12** (this feature) | **13** |
|---|---|
| SessionContextCompressor DO class + system prompt | `checkCompressionNeeded` thresholds |
| `compress.session.context.handler.ts` — Haiku call, parse summary | `compress.session.handler.ts` — orchestration |
| Return typed `CompressionSummary` to caller | `applyCompression` — DB writes, last-10-turns carry-forward |
| Sub-agent spin-up via `subAgent()` | Called from live turn loop before new user turn |

---

## Maintenance-only tools (not in public 17-tool set)

Defined in `15-brain-maintenance-and-behavior-patterns.md`. Brain RPC / internal executables — not exposed to `chat` sessions.

| Tool | Used by | Side effects |
|---|---|---|
| `get_skills_for_brain_maintenance` | BrainMaintenanceAgent | None — no use_count bump |
| `get_personality_traits_for_brain_maintenance` | Both maintenance agents | None |
| `get_user_memory_for_brain_maintenance` | Both | None — no read_count bump |
| `get_memory_events_since` | BehaviorPatternAgent | Read-only |
| `update_personality_trait` | BrainMaintenanceAgent | Writes `user_personality` |
| `archive_personality_trait` | BrainMaintenanceAgent | Sets `isActive = false` |
| `create_personality_trait` | BrainMaintenanceAgent | Inserts trait row |
| `check_active_session` | Both alarm agents | Read-only |

Forwarded from public 17 set: `update_user_skill`, `archive_user_skill`, `schedule_user_alarm`, `write_user_memory` (pattern namespace only for BehaviorPatternAgent).

---

## Authorization model

Caller-based enforcement in `_policies/` before every permanent write. Unauthorized call returns `{ error: 'tool_not_authorized', tool, caller }`.

Authoritative matrix: `implementable-specs/15-brain-maintenance-and-behavior-patterns.md` `TOOL_PERMISSIONS` block.

Production `get.brain.tools.ts` is a **subset preview** for live session tool registration — maintenance-specific reads and personality writes are **missing** until **12** ships RPC layer.

---

## Feature boundaries

| Feature | Scope |
|---|---|
| **12** (this) | Three sub-agent DO classes, prompts, pass handlers, maintenance-only tools, spawn contracts, background session semantics, WAL post-step, first-boot alarm seed for maintenance types |
| **13** | Compression thresholds, `checkCompressionNeeded`, `runCompression` / `applyCompression`, continuation context assembly |
| **14** | `dispatch.alarm.handler.ts` — routes `brain_maintenance_run` and `behavior_pattern_detection` to spawn handlers |
| **11** | Generic `openSession` / `closeSession` — sub-agents use same insert/finalize pattern |
| **09** | Alarm row insert/cancel tools sub-agents call for self-reschedule |
| **06** | Skill tools maintenance forwards for Pass 1 |
| **05** | Personality schema maintenance reads/writes |
| **22** | HealthInsightAgent — separate sub-agent, `health_insight_run` alarm |
| **31** | `recall_check` — alarm handler, not a Brain child agent DO |

### Explicitly NOT sub-agents (documented for boundary clarity)

| Name | What it is | Feature |
|---|---|---|
| **WAL checkpoint** | `PRAGMA wal_checkpoint(TRUNCATE)` after maintenance | **12** post-step on maintenance path; spec in **12-schema-version** |
| **DO init seed jobs** | Insert first `brain_maintenance_run` + `behavior_pattern_detection` rows | **12** contract; runs in Brain init (**04** runtime) |
| **recall_check** | Periodic FDA/EFSA poll — build-guide lists it; **09** spec says Path B, not scheduled_alarms | **31** / **14** |
| **HealthInsightAgent** | Weekly health correlation pass | **22** |
| **Alarm session** | `session_type: 'alarm'` for autonomous alarm work | **14** — not the same as sub-agent DO spawn |

---

## Hard boundaries (both maintenance agents)

### BrainMaintenanceAgent CANNOT

- Write `constraints`, `recipes`, `user_memory`, `memory_event`
- Touch system skills
- Call `create_user_skill`

### BehaviorPatternAgent CANNOT

- Write `user_personality`, `constraints`, `recipes`, `skills`
- Write `user_memory` outside `pattern.*`

### Both CANNOT

- Modify other users' DOs
- Modify `scheduled_alarms` except own reschedule via tool
- Modify `sessions` except own background row (Brain manages)

---

## Related product spec (non-implementable spine)

`brioela-specs/17-behavioral-food-pattern-detection.md` describes product-facing pattern types, wellbeing signals, and optional dedicated tables (`behavior_pattern`, `wellbeing_signal`). Implementable spine stores patterns in `user_memory` (`pattern.*`) and traits in `user_personality`. Reconcile dedicated tables in a future feature if product requires them — **12** implements the Brain sub-agent path from spec **15**.
