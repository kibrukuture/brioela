# Brain Alarm Dispatch — Spec

Feature **14**. Alarm **dispatch** inside the per-user `BrioelaBrain` Durable Object: DO wake lifecycle (`alarm()` / `runScheduledAlarm`), reading due `scheduled_alarms` rows, `processing` → `completed`/`failed` transitions, retry/`attempts` enforcement, per-`alarm_type` handler switch, spawning sub-agents and inline `alarm` sessions, and post-dispatch wake-slot refresh.

**Not in this feature:** `schedule_user_alarm` / `cancel_user_alarm` tools and MIN-pending wake **contract definition** (**09-brain-alarm-tools** — **14** implements the callbacks on `BrioelaBrain`); `session_watchdog` **schedule/cancel at session open/close** (**11-brain-sessions-lifecycle**); sub-agent DO classes and spawn handler bodies (**12-brain-sub-agents**, **22-health-intelligence**); Path B event work (Upstash Workflow, immediate HTTP) — never touches `scheduled_alarms` (**10-scheduled-alarms.md**).

**Living catalog note:** `alarm_type` is **free text** on `scheduled_alarms` — not a Zod enum, not a Drizzle enum. Known types below are starting points; new product alarms add a handler branch + scheduling call site — no schema migration. When adding a type, update this inventory **and** the owning feature folder.

---

## Purpose

Cloudflare Durable Objects expose **one** underlying alarm slot. Brioela stores the real queue in `scheduled_alarms` (**09**). Feature **14** is what runs when the DO wakes:

1. Find due work (`status = 'pending'` AND `scheduled_at <= now`).
2. Atomically mark each row `processing` (idempotency guard).
3. Dispatch on `alarm_type` — inline handler, inline LLM session, or sub-agent spawn.
4. Mark `completed` or `failed`; increment `attempts`; write `action_outcome_*` when applicable.
5. Re-point the DO wake slot at `MIN(scheduled_at)` of remaining pending rows (**09** contract).

Without **14**, alarm rows accumulate forever in `pending` and autonomous product work never runs.

---

## Two trigger paths (hard boundary)

| Path | Mechanism | `scheduled_alarms`? | DO alarm slot? | Owner |
|---|---|:---:|:---:|---|
| **A — Time-based** | `schedule_user_alarm` / `writeUserAlarm` + DO wake | Yes | Yes | **09** schedule, **14** dispatch |
| **B — Event-based** | Upstash Workflow → DO HTTP endpoint | No | No | Feature handlers (**31**, scanner, etc.) |

**`recall_check` conflict:** `implementable-specs/10-scheduled-alarms.md` explicitly lists `recall_check` as Path B (immediate on scan). `build-guide/05-brain/05-alarm-system.md` lists it as a 6h `scheduled_alarms` type with first-boot seed. **Prefer implementable spec Path B** — handler case is **31-recall-alerts**, not **14** scheduled dispatch. Document build-guide case as obsolete unless product reverses (see `status.md` G8).

---

## Architecture placement

```text
schedule_user_alarm / writeUserAlarm / session open watchdog  [09 / 11 / 12 init]
        │
        ▼
scheduled_alarms (pending rows, MIN scheduled_at drives wake slot)
        │
        ▼
BrioelaBrain.alarm()  OR  Agents SDK schedule('runScheduledAlarm', { scheduledAlarmId })
        │
        ▼
settleDueAlarms / runScheduledAlarm          ← 14 entry
        │
        ├── mark processing + attempts++
        ├── dispatchAlarm(alarm)              ← 14 router
        │     ├── session_watchdog            → handleSessionWatchdog [14]
        │     ├── brain_maintenance_run       → spawnBrainMaintenance [12]
        │     ├── behavior_pattern_detection  → spawnBehaviorPattern [12]
        │     ├── health_insight_run          → spawnHealthInsight [22]
        │     ├── sickness_followup           → runInlineAlarmSession [14 + 32]
        │     ├── travel_preload              → runInlineAlarmSession [14 + 35]
        │     ├── medication_reminder         → handleMedicationReminder [14 + 22]
        │     ├── weekly_food_summary         → handleWeeklyFoodSummary [14 + 21/35]
        │     ├── scan_followup               → runInlineAlarmSession [14 + 24]
        │     ├── cooking_timer               → no-op or audit finalize [29 primary]
        │     └── default                     → log unknown; mark failed or completed per policy
        │
        └── mark completed/failed; refresh wake slot [09 callbacks]
```

---

## Wake mechanism — authoritative vs build-guide drift

### Authoritative (implementable specs + shipped **09** tools)

**MIN-pending batch wake:**

```text
1. DO alarm fires (ctx.storage.setAlarm(MIN pending scheduled_at) OR Agents SDK equivalent)
2. SELECT * FROM scheduled_alarms
     WHERE user_id = ? AND status = 'pending' AND scheduled_at <= now()
     ORDER BY scheduled_at ASC
3. FOR EACH row: processing → dispatch → completed|failed
4. readEarliestPendingScheduledAt → scheduleAlarm(next) | cancelAlarm()
```

- One wake processes **all** overdue rows in one pass.
- `AlarmWakeCallbacks` injected from `BrioelaBrain` (**09** type in `schedule.user.alarm.executable.ts`).
- Matches `implementable-specs/10-scheduled-alarms.md` steps 5–11.

### Build-guide alternative (not shipped; document only)

`build-guide/05-brain/05-alarm-system.md` + `07-agent-framework-hardening.md` show **per-row** Agents SDK `schedule()` with payload `{ scheduledAlarmId }`, writing `sdk_schedule_id` on insert. Shipped **09** tools do **not** write `sdk_schedule_id`. If product adopts per-row SDK schedules later, `runScheduledAlarm({ scheduledAlarmId })` loads one row, idempotency-checks `pending`, dispatches, then still refreshes MIN-pending for the slot. **Production migration follows batch MIN-pending until explicitly changed** (see `status.md` G6).

---

## Core dispatch contract

### Entry points

| Method | Signature | When |
|---|---|---|
| `alarm()` | DO lifecycle — no payload | Raw `setAlarm(MIN)` fires; calls `settleDueAlarms` |
| `runScheduledAlarm` | `(payload: { scheduledAlarmId: string })` | Per-row SDK schedule callback (if adopted) |
| `settleDueAlarms` | `(database, brain, userId, wake)` | Batch processor — canonical for MIN-pending |

### Row lifecycle (per alarm)

```text
pending
  → processing (started_at = now, attempts = attempts + 1)   [conditional UPDATE WHERE status = pending]
  → completed (completed_at = now)                             [success]
  → failed (failure_reason = string)                           [max attempts or hard error]
  → pending (retry)                                            [transient failure, attempts < MAX]
```

**Status enum (shipped schema):** `pending | processing | completed | failed | cancelled` — never `fired` (obsolete ledger term).

**Max attempts:** spec says "enforced in handler logic" — value not fixed in implementable specs. Build-guide implies single-try then `failed`. **14** should define `MAX_ALARM_ATTEMPTS` constant (suggest 3 — document in `build.md`; not invented in production until constant file ships).

**Stuck `processing`:** If DO dies mid-handler, row stays `processing`. Next wake should either retry `processing` rows older than a staleness threshold or increment attempts and re-dispatch. **Prefer:** at wake, also select `status = 'processing'` where `started_at < now - STALE_PROCESSING_MS` (see draft).

### Idempotency

- Conditional update: `WHERE id = ? AND status = 'pending'` before dispatch.
- If zero rows updated → another wake already claimed it → return (at-least-once safe).
- `session_watchdog`: if session already `completed`/`abandoned`/`compressed` → no-op, still mark alarm `completed`.

### Post-dispatch wake refresh

After **all** rows in the batch finish:

```typescript
const next = readEarliestPendingScheduledAt(database, userId)
if (next) await wake.scheduleAlarm(next.scheduledAt)
else await wake.cancelAlarm()
```

Same contract as **09** cancel/schedule executables.

---

## Session rows created by dispatch

| Alarm type | `sessions.session_type` | `sessions.alarm_type` | When created |
|---|---|---|---|
| `session_watchdog` | — | — | No session; mutates existing session row |
| `brain_maintenance_run` | `background` | `brain_maintenance_run` | Before `subAgent(BrainMaintenanceAgent)` — **12** spawn handler |
| `behavior_pattern_detection` | `background` | `behavior_pattern_detection` | Before `subAgent(BehaviorPatternAgent)` — **12** |
| `health_insight_run` | `background` | `health_insight_run` | Before `subAgent(HealthInsightAgent)` — **22** |
| `sickness_followup` | `alarm` | `sickness_followup` | At dispatch — inline LLM session in Brain |
| `travel_preload` | `alarm` | `travel_preload` | At dispatch |
| `scan_followup` | `alarm` | `scan_followup` | At dispatch (may hand off to Mira scene **24**) |
| `weekly_food_summary` | `alarm` or `background` | `weekly_food_summary` | At dispatch |
| `medication_reminder` | — (optional `alarm`) | — | Primarily external call/push; may open short `alarm` session for logging |
| `cooking_timer` | — | — | **29** MiraSession owns; Brain row is audit mirror only |

Source: `implementable-specs/07-sessions.md`, `15-brain-maintenance-and-behavior-patterns.md`, `build-guide/05-brain/05-alarm-system.md`.

---

## Complete alarm type inventory

> **Living snapshot (2026-06-12 audit).** Grep sources: `implementable-specs/10-scheduled-alarms.md`, `build-guide/05-brain/05-alarm-system.md`, `07-sessions.md`, `15-maintenance`, `17-session-lifecycle`, `cooking-session/06-timers.md`, `29-health-intelligence/*`, `18-ambient-intelligence/*`, `16-illness-detective/*`, shipped `alarm.tool.test.ts` examples.

| `alarm_type` | In **14** dispatch? | Schedules via | Dispatch action | Session row? | Primary source MDs |
|---|---|---|---|---|---|
| `session_watchdog` | **Yes** | **11** `openSession` → `writeUserAlarm` | Abandon inactive `active` sessions or reschedule +1h | No | `17-session-lifecycle.md`, `11-brain-sessions-lifecycle/spec.md` |
| `brain_maintenance_run` | **Yes** | **12** first-boot seed; **12** self-reschedule; agent `schedule_user_alarm` | `spawnBrainMaintenance` → sub-agent **12** | `background` | `15-maintenance`, `12-schema-version.md`, `05-alarm-system.md` |
| `behavior_pattern_detection` | **Yes** | Same as maintenance | `spawnBehaviorPattern` → sub-agent **12** | `background` | `15-maintenance`, `05-alarm-system.md` |
| `health_insight_run` | **Yes** (case) | **22** first-boot / self-reschedule | `spawnHealthInsight` → sub-agent **22** | `background` | `29-health-intelligence/03-health-insight-agent.md` |
| `sickness_followup` | **Yes** | Agent `schedule_user_alarm` after illness signal | Inline `alarm` session — LLM check-in | `alarm` | `10-scheduled-alarms.md`, `16-illness-detective/05-output-privacy-and-followup.md` |
| `travel_preload` | **Yes** | Agent after travel intent confirmed | Inline `alarm` session — preload destination intel | `alarm` | `10-scheduled-alarms.md`, `18-ambient-intelligence/03-pre-trip-food-intelligence.md` |
| `medication_reminder` | **Yes** | **22** medication schedule job | Vapi/Bland call or OneSignal push; outcome on alarm row | Optional | `29-health-intelligence/02-medication-reminders.md`, `01-medication-tracking.md` |
| `weekly_food_summary` | **Yes** (build-guide) | First-boot or cron-style seed (build-guide) | Generate summary + push notification **21** | `alarm`/`background` | `05-alarm-system.md`, `18-ambient-intelligence/01-ambient-alarm-loop.md` |
| `scan_followup` | **Yes** (build-guide) | Agent after certain scans **24** | Inline session or Mira `scan_followup` scene | `alarm` | `05-alarm-system.md`, `30-mira/01-scene-contract.md` |
| `cooking_timer` | **Partial** | **29** Mira `schedule_timer` (audit mirror to Brain) | **Mira** `fireCookingTimer` — Brain dispatch should no-op or sync audit row | No (Mira) | `08-cooking-session/05-timers.md`, `cooking-session/06-timers.md`, **09** G9 |
| `recall_check` | **No** (Path B) | N/A — event on scan | **31** Upstash Workflow, not scheduled queue | `background` via HTTP | `10-scheduled-alarms.md` excludes; `05-alarm-system.md` incorrectly includes |
| `sickness_followup` (examples) | — | — | — | — | `brioela-tools/11-schedule-user-alarm.md` |
| `travel_preload` (examples) | — | — | — | — | `brioela-tools/12-cancel-user-alarm.md`, `16-load-session-context.md` |

**Test-only / example types in shipped tests:** `sickness_followup`, `brain_maintenance_run`, `travel_preload` — `alarm.tool.test.ts`.

**Ambient loop kinds (not `alarm_type` strings):** `behavior_pattern_intervention`, `time_machine_moment`, `guest_memory_promotion` — these are **notification/surface kinds** in `18-ambient-intelligence/01-ambient-alarm-loop.md`, not separate `scheduled_alarms.alarm_type` values unless product adds them later.

---

## Per-type handler specifications

### `session_watchdog`

**Schedules:** **11** — every `openSession` inserts one pending row; `triggering_session_id = sessionId`; payload `{ session_id }` (prefer snake_case per **17**).

**Watchdog fire delay (schedule time):**

| `session_type` | Fire after session start |
|---|---|
| `chat` | 2 hours |
| `cooking` | 8 hours |
| `alarm` | 1 hour |
| `background` | 1 hour |

Source: `implementable-specs/17-session-lifecycle.md` (prefer over build-guide 2h/4h).

**Dispatch logic (**14** owns — detection contract from **11**):**

1. Parse `payload.session_id` (also accept legacy `sessionId` key — see G11).
2. Load session. If `status !== 'active'` → no-op.
3. Load last `session_turns.created_at` (or `started_at` if no turns).
4. Compare inactivity to threshold:

| `session_type` | Inactivity threshold |
|---|---|
| `chat` | 30 minutes |
| `cooking` | 1 hour |
| `alarm` | 15 minutes |
| `background` | 15 minutes |

5. If inactive ≥ threshold → `status: abandoned`, `endReason: timeout`, `outcome_summary` from `buildAbandonedSummary`.
6. If still recently active → insert **new** pending `session_watchdog` +1 hour (same `triggering_session_id`); refresh wake slot.

**Does not:** spawn sub-agent, run LLM, send push (unless product adds later).

**Cancels:** **11** `closeSession` and **13** compression — not **14**.

Sources: `implementable-specs/17-session-lifecycle.md` § Part 2, `_features/11-brain-sessions-lifecycle/spec.md`.

---

### `brain_maintenance_run`

**Schedules:**
- **12** `initializeBrainSubAgentAlarms` — first pending row `now + 7 days` if none exists (`12-schema-version.md`, `15-maintenance`).
- Sub-agent success path — `schedule_user_alarm` `now + 7 days` (`15-maintenance`).
- Active-session defer — sub-agent or spawn handler reschedules `now + 1 hour` (`15-maintenance` — prefer over build-guide 2h).

**Dispatch:** Call `spawnBrainMaintenance(database, brain, userId, wake)` — **12** owns body; **14** owns switch case.

**Flow (summary):**
1. `check_active_session` — defer if active.
2. Insert `background` session, `alarm_type: brain_maintenance_run`.
3. `subAgent(BrainMaintenanceAgent, brain-maintenance-${userId}-${runId})`.
4. `runMaintenancePass` — three passes (**12**).
5. Finalize session; WAL TRUNCATE checkpoint; update `agent_state` `brain_maintenance.last_run`.
6. Reschedule +7d (in spawn handler, not duplicate in **14**).

**Payload:** `{}` or `{ userId }` — handler must not require fields absent from seed rows.

Sources: `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`, `build-guide/05-brain/04-sub-agents.md`.

---

### `behavior_pattern_detection`

**Schedules:**
- **12** init — `now + 3 days` if no pending (`15-maintenance`, `12-schema-version` — **not** build-guide 14 days).
- Sub-agent success — `schedule_user_alarm` `now + 3 days`.
- Active-session defer — `now + 1 hour`.

**Dispatch:** `spawnBehaviorPattern(database, brain, userId, wake)` — **12**.

**Flow:** Same session/sub-agent pattern as maintenance; writes `pattern.*` `user_memory`; updates `behavior_pattern_detection.last_run` in `agent_state` on success only.

Sources: `15-maintenance`, `05-brain/04-sub-agents.md`.

---

### `health_insight_run`

**Schedules:** **22** — weekly cadence; first-boot seed per `29-health-intelligence/03-health-insight-agent.md` (not in `12-schema-version` init list — **22** owns seed handler).

**Dispatch:** `spawnHealthInsight(database, brain, userId, wake)` — **22** owns DO class; **14** owns router case.

**Flow:** `background` session → `subAgent(HealthInsightAgent, health_${userId}_${runId})` → three passes → community writes with k-anonymity → `action_outcome_*` on alarm row → reschedule next `health_insight_run`.

**Not in feature 12** — cross-reference only.

Source: `build-guide/29-health-intelligence/03-health-insight-agent.md`.

---

### `sickness_followup`

**Schedules:** Agent via `schedule_user_alarm` 4–24h after illness signal (`10-scheduled-alarms.md`); build-guide/illness-detective says 24h (`16-illness-detective/05-output-privacy-and-followup.md`).

**Payload (authoritative examples):** `{ memory_event_ids: string[], symptoms_reported: string }` per `10-scheduled-alarms.md`.

**Dispatch:**
1. Open `alarm` session row, `alarm_type: sickness_followup`.
2. Build alarm-specific system prompt (**32** illness-detective).
3. Run bounded LLM turn loop (**20** pattern) — check how user feels, offer illness report filing.
4. `closeSession` with outcome summary.
5. Optionally log `memory_event`.

**Does not** spawn sub-agent DO.

Sources: `10-scheduled-alarms.md`, `16-illness-detective/05-output-privacy-and-followup.md`, `07-sessions.md`.

---

### `travel_preload`

**Schedules:** Agent when travel intent confirmed — 48h before departure or ASAP if within 48h (`18-ambient-intelligence/03-pre-trip-food-intelligence.md`).

**Payload:** `{ destination, departure_at }` per `10-scheduled-alarms.md`; may include `intentId`, geo fields per ambient spec.

**Dispatch:**
1. Open `alarm` session, `alarm_type: travel_preload`.
2. Run preload job — may delegate heavy IO to QStash worker (`03-pre-trip-food-intelligence.md`).
3. Write `user_memory` / travel cache keys.
4. Close session; mark alarm `completed`; write `action_outcome_*` if job status tracked.

Sources: `10-scheduled-alarms.md`, `18-ambient-intelligence/03-pre-trip-food-intelligence.md`.

---

### `medication_reminder`

**Schedules:** **22** medication tracking — recurring daily rows per active medication (`29-health-intelligence/01-medication-tracking.md`, `02-medication-reminders.md`).

**Payload:** `{ medicationId, drugName, doseInfo }` (build-guide).

**Dispatch:**
1. Load medication; check `HIGH_STAKES_MEDICATION_CATEGORIES`.
2. If high-stakes + phone → Vapi/Bland AI call (`triggerMedicationCall`).
3. Else → OneSignal push (`triggerMedicationPush`).
4. Update same alarm row: `action_outcome_status` (`calling`|`answered`|`missed`|`notified`|`failed`), `action_outcome_json` (`took`, `call_sid`, `answered_at`).
5. Schedule next day's reminder (new `scheduled_alarms` row — **22** helper).

**Does not** use separate `medication_reminders` table.

Source: `build-guide/29-health-intelligence/02-medication-reminders.md`, `06-brain-memory/01-sqlite-schema.md`.

---

### `weekly_food_summary`

**Schedules:** Build-guide — Sunday morning user local time; may use Agents SDK cron `schedule("0 8 * * 0", ...)` (`07-agent-framework-hardening.md`).

**Dispatch:** Generate weekly food summary content; push via **21-platform-notifications**; reschedule next Sunday.

**Cross-ref:** `18-ambient-intelligence/01-ambient-alarm-loop.md` lists as Time Machine surface candidate.

Source: `build-guide/05-brain/05-alarm-system.md`.

---

### `scan_followup`

**Schedules:** 7 days after certain product scans (`05-alarm-system.md`).

**Payload:** `{ userId, productId, scanEventId }` (build-guide).

**Dispatch:** Inline `alarm` session or route to Mira `scan_followup` scene (**24**, **30-mira**). Product decision: Brain inline vs Mira handoff — document both; **14** case must call one orchestrator.

Source: `05-alarm-system.md`, `30-mira/01-scene-contract.md`.

---

### `cooking_timer`

**Schedules:** **29** MiraSession `schedule_timer` — fire-and-forget mirror to Brain via `schedule_user_alarm` with **legacy payload shape** (`alarm_id`, `fires_at` — **09** G9 mismatch).

**Dispatch:** **Mira** `fireCookingTimer` is authoritative. Brain **14** case should:
- Option A: no-op `completed` (audit only).
- Option B: verify mirror row, sync `action_outcome_status`.

**Not** an inline LLM session in Brain.

Sources: `build-guide/08-cooking-session/05-timers.md`, `implementable-specs/cooking-session/06-timers.md`.

---

### `recall_check` — Path B (NOT **14** scheduled dispatch)

**Authoritative:** `10-scheduled-alarms.md` — immediate event on scan, Upstash Workflow, `background` session via HTTP. **31-recall-alerts** owns handler.

**Obsolete:** `05-alarm-system.md` switch case + first-boot seed — do not implement in **14** until product explicitly moves recall to Path A.

---

### `default` (unknown `alarm_type`)

Log warning with `alarm_type` and `id`. Policy choices (product):
- Mark `failed` with `failure_reason: unknown_alarm_type` (strict), or
- Mark `completed` with no-op (permissive for forward-compatible scheduling).

**Prefer strict `failed`** so bad rows surface in Data Studio.

---

## `action_outcome_status` / `action_outcome_json`

Generic outcome columns on `scheduled_alarms` for any alarm type (`06-brain-memory/01-sqlite-schema.md`):

- Medication: `action_outcome_status: 'answered'`, `action_outcome_json: { took: 1, call_sid, answered_at }`
- Travel preload: job status in JSON
- Health insight: contribution result

**14** dispatch sets these when the handler produces an auditable outcome before marking `completed`.

---

## Feature boundaries

| Concern | Owner |
|---|---|
| Insert/cancel pending rows; dedup at schedule time | **09** |
| MIN-pending `AlarmWakeCallbacks` type | **09** defines; **14** implements on `BrioelaBrain` |
| `session_watchdog` schedule/cancel on open/close | **11** |
| `session_watchdog` fire + inactivity logic | **14** |
| `dispatchAlarm` switch + `settleDueAlarms` | **14** |
| `spawnBrainMaintenance` / `spawnBehaviorPattern` bodies | **12** |
| Sub-agent DO classes | **12** |
| First-boot seed maintenance + pattern alarms | **12** (`initializeBrainSubAgentAlarms`) |
| `HealthInsightAgent` + `health_insight_run` seed | **22** |
| Illness followup prompt + report flow | **32** |
| Travel preload jobs + destination cache | **35** |
| Medication call/push providers | **22** + **21** |
| `recall_check` event path | **31** |
| Cooking timer fire | **29** |
| Live chat turn loop for inline `alarm` sessions | **20** |

---

## Naming drift (historical)

| Drift | Resolution |
|---|---|
| Ledger `fired` status | Use `completed` |
| `alarm.handler.ts` vs `dispatch.alarm.handler.ts` | Prefer `dispatch.alarm.handler.ts` per ledger `0001` |
| Payload `sessionId` vs `session_id` | Prefer `session_id` (**17**) |
| Maintenance defer 1h vs 2h | Prefer **15** (1h) |
| Pattern cadence 3d vs 14d vs weekly | Prefer **15** + **12-schema-version** (3d) |
| Batch wake vs per-row SDK | Prefer **10-scheduled-alarms** batch + MIN-pending |
| `07-sessions.md` lists `recall_check` as session `alarm_type` | Session column is nullable free text; recall is Path B — column may be set if inline session used by **31** |

---

## Sources (read for this migration)

### Implementable specs
- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/07-sessions.md`
- `implementable-specs/12-schema-version.md`
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/17-session-lifecycle.md`
- `implementable-specs/brioela-tools/11-schedule-user-alarm.md`
- `implementable-specs/brioela-tools/12-cancel-user-alarm.md`
- `implementable-specs/cooking-session/06-timers.md`

### Build guides
- `build-guide/05-brain/03-session-lifecycle.md`
- `build-guide/05-brain/04-sub-agents.md`
- `build-guide/05-brain/05-alarm-system.md`
- `build-guide/05-brain/07-agent-framework-hardening.md`
- `build-guide/06-brain-memory/01-sqlite-schema.md`
- `build-guide/08-cooking-session/05-timers.md`
- `build-guide/16-illness-detective/05-output-privacy-and-followup.md`
- `build-guide/18-ambient-intelligence/01-ambient-alarm-loop.md`
- `build-guide/18-ambient-intelligence/03-pre-trip-food-intelligence.md`
- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/29-health-intelligence/01-medication-tracking.md`
- `build-guide/29-health-intelligence/02-medication-reminders.md`
- `build-guide/29-health-intelligence/03-health-insight-agent.md`
- `build-guide/30-mira/01-scene-contract.md`

### Ledgers & complaints
- `_records/implementation-ledger/brain/06-alarm-system/0001.alarm-dispatch.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0004.alarm-tools.md`

### Neighbor feature migrations
- `_features/09-brain-alarm-tools/spec.md`
- `_features/11-brain-sessions-lifecycle/spec.md`
- `_features/12-brain-sub-agents/spec.md`
