# Brain Sub-Agents — Spec

Feature **12**. Three Brain-owned **child agents** — ephemeral Durable Objects spawned by `BrioelaBrain`, each with a dedicated system prompt, tool/capability subset, background `sessions` row, and typed parent RPC boundary. Permanent user truth stays in Brain SQLite; sub-agents reason and propose writes; Brain validates and executes.

**Not in this feature:** compression **thresholds/triggers** and `checkCompressionNeeded` (**13-brain-session-compression**); alarm **dispatch router** and DO wake wiring (**14-brain-alarm-dispatch**); session **open/close** lifecycle (**11-brain-sessions-lifecycle**); `schedule_user_alarm` / `cancel_user_alarm` tool implementation (**09-brain-alarm-tools**); skill CRUD tools maintenance consumes (**06-brain-skill-tools**); Health Insight Agent (**22-health-intelligence**); `recall_check` alarm handler (**31-recall-alerts** / Path B per **09**); live chat turn loop (**20-brain-chat-runtime**).

**Feature 12 scope is unchanged:** only the three Brain-owned background child DOs below. This file also catalogs every other agent-like runtime in the system so nothing is "missed" — see **Complete agent inventory** and **Agents outside feature 12 scope**.

---

## Complete agent inventory

> **The agent catalog documented here is not exhaustive or frozen.** Brioela's agent surface will grow over time — new product agents, new Brain child DOs, new alarm-driven passes. Feature **12** owns Brain-spawned child agents; other features own product-facing agents (Mira cooking **29**, Bela **42**, web search **18**, etc.). When adding a new agent, update this inventory **and** the owning feature folder.

Every agent-like runtime discovered across `implementable-specs/`, `build-guide/`, `brioela-specs/`, `_features/README.md`, `_records/implementation-ledger/`, and `backend/src/agents/` (2026-06-12 audit). **This table is a living snapshot, not a closed list.**

**Shipped in backend today:** `BrioelaBrain` only (`backend/src/agents/brain/brioela.brain.agent.ts`). No `MiraSession`, `BelaOrderAgent`, or any `_subagents/` classes exist yet.

### Taxonomy

| Category | Meaning |
|---|---|
| **Permanent DO** | Long-lived Durable Object keyed to user or entity; owns runtime state |
| **Ephemeral session DO** | One DO instance per live session or order; dies when work completes |
| **Brain child sub-agent DO** | Ephemeral DO spawned by `BrioelaBrain` via `subAgent()`; permanent writes via typed Brain RPC |
| **Inline alarm session** | `BrioelaBrain` runs LLM + tools inside an `alarm` or `background` session row — no separate DO class |
| **Tool / function** | Brain executable or plain async function — not an Agent DO |
| **Module** | Library used inside a session DO — not its own agent |

### Master table

| Name | Type | Feature # | In **12**? | Shipped? | Relationship to BrioelaBrain | Primary source files |
|---|---|---|:---:|---|---|---|
| **BrioelaBrain** | Permanent DO | **04** | No (parent) | Partial | Root per-user brain; spawns child sub-agents; runs chat + alarm inline sessions | `brioela.brain.agent.ts`, `build-guide/05-brain/01-do-class-and-setup.md`, `implementable-specs/00-overview.md` |
| **BrainMaintenanceAgent** | Brain child sub-agent DO | **12** | **Yes** | No | `subAgent(..., brain-maintenance-${userId}-${runId})`; alarm `brain_maintenance_run` | `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`, `build-guide/05-brain/04-sub-agents.md`, ledger `07-sub-agents/0001` |
| **BehaviorPatternAgent** | Brain child sub-agent DO | **12** | **Yes** | No | `subAgent(..., behavior-pattern-${userId}-${runId})`; alarm `behavior_pattern_detection` | Same as above; ledger `07-sub-agents/0002` |
| **SessionContextCompressor** | Brain child sub-agent DO | **12** (+ orchestration **13**) | **Yes** | No | Inline compression trigger; no tools; returns four-field JSON to Brain | `implementable-specs/17-session-lifecycle.md`, ledger `07-sub-agents/0003` |
| **HealthInsightAgent** | Brain child sub-agent DO | **22** | No (cross-ref) | No | `subAgent(..., health_${userId}_${runId})`; alarm `health_insight_run`; community Postgres writes | `build-guide/29-health-intelligence/03-health-insight-agent.md` |
| **MiraSession** | Ephemeral session DO (one class, many scenes) | **29** (+ **30**, scene builders) | No | No | Sibling DO — not Brain child; forwards permanent writes to Brain RPC; owns Gemini Live + local recovery SQLite | `implementable-specs/cooking-session/02-mira-session.md`, `build-guide/08-cooking-session/02-mira-session-do.md`, `build-guide/30-mira/00-overview.md` |
| **Mira — cooking scene** | MiraSession + `MiraSceneKind: cooking` | **29** | No | No | Brain creates room + MiraSession DO; session_type `cooking` | `implementable-specs/cooking-session/`, `brioela-specs/10-mira-cooking-voice.md`, `11-live-vision-cooking-coach.md` |
| **Mira — bela_shopper scene** | Mira live presence in Bela context | **42** (+ **29**/**30**) | No | No | **Conflict:** `implementable-specs/bela/14-shopper-ai-assistant.md` embeds Gemini in **BelaOrderAgent**; `build-guide/11-bela/14-shopper-ai-assistant.md` starts **MiraSession** + BelaOrderAgent for order state | `implementable-specs/bela/14-shopper-ai-assistant.md`, `build-guide/11-bela/14-shopper-ai-assistant.md`, `build-guide/30-mira/01-scene-contract.md` |
| **Mira — menu_language_bridge** | MiraSession scene | **28** | No | No | Language bridge for restaurant staff | `build-guide/17-menu-scanning/08-language-bridge.md`, `30-mira/01-scene-contract.md` |
| **Mira — recipe_review** | MiraSession scene | **25** | No | No | Recipe ingestion / share review conversation | `build-guide/19-recipe-ingestion/08-shared-content-classifier.md`, `05-confidence-and-constraints.md` |
| **Mira — scan_followup** | MiraSession scene | **24** | No | No | Post-scan follow-up conversation | `30-mira/01-scene-contract.md` |
| **Mira — kid_co_scan / kid_explanation** | MiraSession scenes | **44** | No | No | Kids mode co-scan and child-facing explanations | `30-mira/00-overview.md`, `21-kids-mode/` |
| **Mira — in-store shop visit** | MiraSession (audio-only); DO name `shop-{userId}-{visitId}` | **45** | No | No | Reuses Mira runtime; **no explicit `MiraSceneKind` in contract yet** — gap vs `45-in-store-copilot` | `build-guide/32-in-store-copilot/01-session-lifecycle.md`, `brioela-specs/45-in-store-copilot.md` |
| **BelaOrderAgent** | Ephemeral order DO | **42** | No | No | Sibling DO keyed by `order_id`; order state machine, scan relay, constraint snapshot; may host shopper Gemini | `implementable-specs/bela/00-overview.md`, `13-data-model.md`, `04-live-scan-session.md` |
| **BrioelaBrain chat runtime** | Inline in BrioelaBrain (`session_type: chat`) | **20** | No | No | Not a separate DO — `onMessage` / `chat()` on Brain; full tool registry minus cooking-only paths | `build-guide/05-brain/07-agent-framework-hardening.md`, ledger `08-framework-hardening/0001.chat-entrypoint.md` |
| **search_web** | Brain tool (not agent) | **18** | No | No | Tavily/Exa HTTP from Brain executable; **`chat` sessions only** per ledger `0007.web-tool.md`; Mira does own lookups during cooking | `implementable-specs/brioela-tools/18-search-web.md`, `_features/18-brain-web-search/status.md` |
| **Alarm: sickness_followup** | Inline alarm session in Brain | **32** (+ **14**) | No | No | LLM check-in after illness report; schedules from user/agent | `implementable-specs/10-scheduled-alarms.md`, `build-guide/16-illness-detective/05-output-privacy-and-followup.md` |
| **Alarm: travel_preload** | Inline alarm session in Brain | **35** (+ **14**) | No | No | Pre-load destination food context before trip | `implementable-specs/10-scheduled-alarms.md`, `build-guide/18-ambient-intelligence/` |
| **Alarm: medication_reminder** | Inline alarm handler (+ Vapi voice call) | **22** (+ **14**) | No | No | Not a separate agent DO — Brain alarm case triggers call/push; outcome on `scheduled_alarms` row | `build-guide/29-health-intelligence/02-medication-reminders.md` |
| **Alarm: session_watchdog** | Inline handler (no LLM) | **11** (+ **14**) | No | No | Marks abandoned sessions; no sub-agent spawn | `implementable-specs/17-session-lifecycle.md` |
| **recall_check** | Event Path B (NOT scheduled_alarms per **09**) | **31** | No | No | Build-guide **05-alarm-system** lists as 6h alarm — **conflicts with spec 09**; not a Brain child DO | `implementable-specs/10-scheduled-alarms.md` (excludes), `build-guide/05-brain/05-alarm-system.md` (includes) |
| **Product scan analysis** | Plain async function | **24** | No | No | **Not** ProductScanAgent DO — spec **09-per-user-brain** explicitly rejects sub-agent for scans | `brioela-specs/09-per-user-brain.md` (lines 32–47); ghost name in `15-brain-maintenance` line 35 only |
| **MiraSpeechDecisionEngine** | Module inside MiraSession | **30** | No | No | Produces speak/don't-speak decisions; not a DO | `implementable-specs/cooking-session/mira-speech-decision-engine/`, `build-guide/08-cooking-session/04-mira-speech-decision-engine.md` |
| **17 SQLite brain tools** | Brain tools / executables | **05–09**, **16**, **19** | No | Partial | Invoked by Brain inline sessions and forwarded from Mira via RPC — not separate agents | `implementable-specs/brioela-tools/01–17`, `build-guide/05-brain/02-tool-protocol.md` |
| **Generative grammar / Stage UI** | Client + Brain tool selection | **52** | No | No | Registered React components + Zod — not an Agent DO | `build-guide/27-generative-grammar/`, `brioela-specs/42-brioela-generative-grammar.md` |
| **RAG / enrich / db agents** (legacy) | Speculative `${userId}-rag` pattern | — | No | No | **Stale** — `brioela-specs/24-technical-architecture-backbone.md` stub.fetch delegation; superseded by Brain tools + Vectorize **17** | `brioela-specs/24-technical-architecture-backbone.md` §4 |

### MiraSceneKind contract (one Mira, many scenes)

Authoritative scene kinds from `build-guide/30-mira/01-scene-contract.md`:

`cooking` · `bela_shopper` · `menu_language_bridge` · `recipe_review` · `scan_followup` · `kid_explanation` · `kid_co_scan`

In-store co-pilot (**45**) reuses Mira session lifecycle but does not yet appear in this enum — document as open reconciliation.

---

## Agents outside feature 12 scope

Feature **12** ships only **BrainMaintenanceAgent**, **BehaviorPatternAgent**, and **SessionContextCompressor**. Everything below is owned by other feature folders but must appear in this catalog so the migration is not read as "three agents total."

| Agent / runtime | Owning feature | Why not **12** |
|---|---|---|
| **MiraSession** (+ all Mira scenes) | **29-cooking-session**, **30-mira-speech-engine**, scene owners (**42**, **28**, **25**, **44**, **45**) | Sibling session DO — not spawned by Brain maintenance/compression path; Gemini Live transport |
| **BelaOrderAgent** | **42-bela** | Order-scoped state machine + WebSocket relay; separate wrangler binding |
| **HealthInsightAgent** | **22-health-intelligence** | Fourth Brain child sub-agent — same spawn pattern as **12** trio but health alarm + community Postgres |
| **BrioelaBrain chat** | **20-brain-chat-runtime** | Inline turn loop on permanent Brain DO |
| **search_web** | **18-brain-web-search** | External HTTP tool executed in Brain — not an agent DO |
| **Alarm inline sessions** | **14-brain-alarm-dispatch** + feature handlers (**32**, **35**, **22**, **31**) | Brain runs work in `alarm` session rows; only maintenance/pattern/health/compressor spawn separate DOs |
| **Scanner / illness / ambient workflows** | **24**, **32**, **35**, etc. | Path B Upstash Workflow or plain functions — see `implementable-specs/10-scheduled-alarms.md` |

Draft gap snapshots for major non-**12** DOs live in `draft/` (`mira.session.agent.gap.md`, `bela.order.agent.gap.md`, `health.insight.agent.gap.md`, `search.web.tool-boundary.gap.md`).

---

## Purpose

Long-running user brains accumulate stale skills, decaying personality traits, raw behavioral events, and oversized session transcripts. Three background agents keep derived state accurate without interrupting live sessions.

**Scope vs catalog:** Feature **12** ships only the three Brain-owned child DOs below. The **Complete agent inventory** above is a cross-feature living catalog — it will gain rows as the product grows; it is not limited to these three.

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

See **Complete agent inventory** for the full list. Summary:

| Name | What it is | Feature |
|---|---|---|
| **MiraSession** | Ephemeral live-session DO (cooking, shop, menu, etc.) — sibling to Brain, not child | **29** / **30** / scene owners |
| **BelaOrderAgent** | Per-order DO — state machine + scan relay (+ shopper Gemini per bela/14) | **42** |
| **search_web** | Brain tool — external Tavily/Exa HTTP | **18** |
| **BrioelaBrain chat** | Inline `chat` session on Brain DO | **20** |
| **Product scan** | Plain `analyzeProduct()` function — not ProductScanAgent DO | **24** |
| **MiraSpeechDecisionEngine** | Module inside MiraSession | **30** |
| **WAL checkpoint** | `PRAGMA wal_checkpoint(TRUNCATE)` after maintenance | **12** post-step on maintenance path; spec in **12-schema-version** |
| **DO init seed jobs** | Insert first `brain_maintenance_run` + `behavior_pattern_detection` rows | **12** contract; runs in Brain init (**04** runtime) |
| **recall_check** | Periodic FDA/EFSA poll — build-guide lists it; **09** spec says Path B, not scheduled_alarms | **31** / **14** |
| **HealthInsightAgent** | Weekly health correlation pass — Brain child DO but **22**, not **12** | **22** |
| **Alarm inline sessions** | `session_type: 'alarm'` for sickness_followup, travel_preload, medication_reminder, etc. | **14** + feature handlers |
| **Legacy RAG/enrich DOs** | Stale backbone pattern — not current architecture | — |

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
