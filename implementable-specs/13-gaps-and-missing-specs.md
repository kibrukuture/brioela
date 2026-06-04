# Gaps and Missing Specs — BrioelOrchestrator

This file documents everything missing from the current implementable specs. Items are organized by importance. We go through these one by one. Nothing here is resolved until it has its own spec or is explicitly closed with a reason.

---

## CRITICAL — Blocks Implementation

### 1. No Agent Identity / SOUL Equivalent

Hermes has `SOUL.md` — a document defining who the agent is: its values, voice, personality, how it handles conflict, what it cares about. Brioela has no equivalent. Without this, the agent has no consistent identity across sessions. Every session it starts fresh with no sense of self. This is not a SQLite table — it is a document that lives in the system prompt. It needs to be designed.

**Status**: CLOSED → `16-agent-identity.md`

---

### 2. No Tool Definitions Spec

Every table references tools: `log_memory_event`, `write_user_memory`, `create_user_skill`, `propose_user_constraint`, `schedule_user_alarm`, `search_session_history`, `view_user_recipe`, `read_user_memory`. None of these are formally specified anywhere — no input schema, no output schema, no error handling, no side effects defined. The Zod schemas in the table specs are partial but not complete tool contracts. This needs its own spec file.

**Status**: CLOSED → `brioela-tools/` folder — all 17 tools fully specced (01–17)

---

### 3. No Curator Spec

The Curator is mentioned 40+ times across every file. It writes to `user_personality`, manages `skills`, reads `constraints`, triggers from `scheduled_alarms`. But there is no single document that says: what does the Curator actually do, in what order, how often, what happens if it fails halfway through, how does it avoid race conditions with an active agent session.

**Status**: CLOSED → `15-curator.md`

---

### 4. Trait Inference Algorithm Missing

`user_personality` table is fully defined. But HOW the Curator actually infers a trait is nowhere documented. What does it read, what model pass does it run, what is the threshold for "this is a real pattern vs noise." Without this, nobody can implement the Curator's personality pass.

**Status**: CLOSED → `15-curator.md` Pass 3 — LLM sub-call prompt, evidence requirements, strength rules, dedup guard

---

## HIGH — Real Design Gaps

### 5. Session `abandoned` Status — No Detection Mechanism

`status = 'abandoned'` is defined in `07-sessions.md` but nothing detects it. Who notices that an app crashed? A heartbeat timeout alarm? A DO alarm that fires if a session has been `active` for too long with no new turns? This needs a concrete mechanism.

**Status**: OPEN

---

### 6. WAL Checkpoint Strategy Missing

WAL mode is set in `00-overview.md` but WAL files grow unbounded without checkpointing. No `PRAGMA wal_autocheckpoint` value defined, no periodic checkpoint call documented. On a heavily used user DO this becomes a cold-start performance problem over time.

**Status**: OPEN

---

### 7. Compression Trigger Not Defined

Session compression via `parent_session_id` chains is described in `07-sessions.md` and `08-session-turns.md`. But WHEN compression triggers is not defined. After N turns? After X tokens? After Y minutes? Nobody can implement compression without this threshold.

**Status**: OPEN

---

### 8. Curator Scheduling — Who Schedules the First Run?

The `curator_run` alarm type exists in `10-scheduled-alarms.md`. But who inserts the first row into `scheduled_alarms`? The DO initialization sequence in `12-schema-version.md` does not mention it. Without this, the Curator never runs for any user until someone manually triggers it.

**Status**: CLOSED → `15-curator.md` — DO initialization seeds both `curator_run` (7 days) and `pattern_detection` (3 days) on first boot

---

### 9. Vectorize Embedding Details Missing

The vector layer is architecturally described in `00-overview.md` but missing:
- What embedding model is used
- What vector dimension (Vectorize requires this upfront)
- When the embedding is created (at session end when `outcome_summary` is written?)
- What happens if embedding creation fails
- How embeddings are updated if `outcome_summary` is edited after the fact
- Exact hash function used for shard calculation (`hash(userId) % SHARD_COUNT` — which hash?)
- How to add a 21st shard when needed (rehashing strategy)

**Status**: OPEN

---

## MEDIUM — Implementation Details

### 10. Auto-Confirmation Thresholds Have No Time Window

`06-constraints.md` lines 154–156 define thresholds ("5+ avoidance events", "3+ negative outcome events", "7+ scan or receipt events") but over what time period? Ever? Last 90 days? Last 30 days? Without a time window, old irrelevant behavior counts forever.

**Status**: CLOSED → `15-curator.md` — dislike: 90 days, intolerance: 60 days, boycott: 120 days

---

### 11. Stale Skill Thresholds Not Defined

`04-skills.md` says "low use_count + old last_used_at = stale candidate" but never defines what "low" or "old" means numerically. The Curator cannot implement stale detection without these numbers.

**Status**: CLOSED → `15-curator.md` Pass 1 — use_count < 3 AND last_used > 30d → stale; stale AND last_used > 60d → archive

---

### 12. Namespace Auto-Discovery Mechanism Not Defined

`02-user-memory.md` says "the AI sees the existing namespace list before writing and extends what exists rather than inventing new ones." But HOW does it see this list? Injected into the system prompt? Via a `read_user_memory` tool call? When — once per session or on every write? Token cost of injecting the full namespace list not addressed.

**Status**: OPEN

---

### 13. FTS5 Triggers — No `IF NOT EXISTS`

SQLite does not support `IF NOT EXISTS` for triggers. The `CREATE TRIGGER` statements in `07-sessions.md` and `08-session-turns.md` will fail on the second run if executed on every DO startup. Triggers must be created exactly once inside a migration, not in the startup sequence. This needs to be explicitly documented in the migration strategy.

**Status**: OPEN

---

### 14. Multi-Dish Cooking Session — Recipe Reconstruction

`09-recipes.md` edge cases section explicitly leaves this open: one cooking session produces two dishes. The `recipe-reconstruction` skill runs once per session — does it segment the transcript and produce two recipe rows? How does it detect the boundary between dishes? No implementation strategy defined.

**Status**: OPEN

---

### 15. Recipe Variants — Update vs New Row

`09-recipes.md` edge cases section explicitly leaves this open: a family member adapts grandma's recipe for dietary restrictions mid-session. Does this produce a new row (named variant) or update the existing row? No decision made.

**Status**: OPEN

---

## What Hermes Has That Brioela Does Not

Hermes is the NousResearch agent framework. It uses three persistent documents alongside its SQLite state:

| Hermes | Brioela equivalent | Gap |
|---|---|---|
| SOUL.md — agent identity and values | Nothing | **Missing entirely — see item 1** |
| MEMORY.md — 2200 char rolling agent notes | user_memory + outcome_summary | Covered differently |
| USER.md — 1375 char compact user profile | user_memory | Covered |
| state.db sessions + FTS5 | sessions + session_turns + FTS virtual tables | Covered |
| parent_session_id compression chains | Covered in 07-sessions.md | ✓ |
| Per-session token tracking | Covered in 07-sessions.md | ✓ |

The one thing Hermes has that Brioela genuinely lacks is a defined agent identity. Hermes knows who it is. Brioela does not yet.

---

## New Spec Files Needed

These are not implementation details — they need their own spec documents:

| File | What it covers | Status |
|---|---|---|
| `brioela-tools/01–17` | Formal definition of all 17 tools — input schema, output schema, side effects, error handling | ✓ DONE |
| `15-curator.md` | The Curator process — what it does, in what order, frequency, failure handling, race condition handling, trait inference algorithm | OPEN |
| `16-agent-identity.md` | Who Brioela is — voice, values, personality, how it handles conflict, what it cares about | ✓ DONE |

---

## Closed Items

| Item | What | Where |
|---|---|---|
| 1 | Agent identity / SOUL | `16-agent-identity.md` |
| 2 | Tool definitions (all 17 tools) | `brioela-tools/01–17` |
| 3 | Curator + PatternDetection spec | `15-curator.md` |
| 4 | Trait inference algorithm | `15-curator.md` Pass 3 |
| 8 | First Curator run scheduling | `15-curator.md` — DO init seeds both alarms |
| 10 | Auto-confirm time windows | `15-curator.md` — dislike 90d, intolerance 60d, boycott 120d |
| 11 | Stale skill thresholds | `15-curator.md` Pass 1 — use_count < 3, last_used > 30d/60d |
