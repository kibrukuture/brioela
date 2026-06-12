# Brain Alarm Tools — Spec

Feature **09**. Two AI-callable tools for the time-based alarm queue: `schedule_user_alarm`, `cancel_user_alarm`. They insert and cancel rows in `scheduled_alarms` and keep the DO wake slot pointed at `MIN(scheduled_at)` across pending rows.

**Not in this feature:** alarm dispatch on wake (processing rows, spawning sub-agents, creating `alarm` sessions) — **14-brain-alarm-dispatch**. Event-triggered immediate work (Upstash Workflow, Path B) never touches these tools or this table.

---

## Purpose

Cloudflare Durable Objects expose **one** alarm slot. A user can have many pending future alarms. `scheduled_alarms` is the queue; the DO slot is only the wake-up clock.

**Path A — Time-based (this feature + 14 dispatch)**

```
agent calls schedule_user_alarm(type, scheduled_at, payload)
→ row inserted with status = 'pending'
→ DO wake slot set to MIN(pending scheduled_at) via injected AlarmWakeCallbacks
→ DO sleeps until that timestamp
→ [14] DO wakes, reads due rows, dispatches handlers, marks completed/failed
```

**Path B — Event-based (outside 09)**

External events → Upstash Workflow → DO HTTP endpoint → `background` session. No `scheduled_alarms` row, no alarm slot.

Hard rule from `10-scheduled-alarms.md`: **`recall_check` is Path B**, not a `scheduled_alarms` type — despite `build-guide/05-brain/05-alarm-system.md` listing it in an alarm-types table (see ambiguous sources in `status.md`).

---

## Table owned (tool semantics)

DDL lives in `backend/src/agents/brain/_schemas/scheduled.alarm.schema.ts` (initial CREATE in migration `0000`, owned by **04-brain-foundation**). Migration `0007` adds `triggering_session_id`. This feature owns **write/read rules for tool paths**.

### `scheduled_alarms`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | UUID v4 via `createId()` |
| `user_id` | TEXT | Owner — self-describing |
| `alarm_type` | TEXT | **Free text** — not a Zod enum. Handler dispatches at runtime in **14** |
| `triggering_session_id` | TEXT nullable | Session that scheduled the alarm; NULL for system-seeded rows |
| `payload` | TEXT | JSON object string — handler context at fire time |
| `sdk_schedule_id` | TEXT nullable | Agents SDK schedule id — column exists; **09 tools do not write it** (see G6) |
| `status` | TEXT enum | `pending \| processing \| completed \| failed \| cancelled` |
| `attempts` | INTEGER | Retry counter — incremented by **14** dispatch |
| `failure_reason` | TEXT nullable | Set when status → `failed` |
| `cancelled_at` / `cancel_reason` | INTEGER / TEXT | Set by `cancel_user_alarm` |
| `rescheduled_from_alarm_id` / `rescheduled_to_alarm_id` | TEXT nullable | Reschedule audit chain — not written by 09 tools |
| `label` | TEXT nullable | Human label — column exists; **09 schedule tool has no `label` input** (see G7) |
| `scheduled_at` | INTEGER ms | Target fire time |
| `started_at` / `completed_at` | INTEGER ms nullable | Lifecycle — written by **14** |
| `action_outcome_status` / `action_outcome_json` | TEXT | Dispatch outcome — written by **14** |
| `created_at` / `updated_at` | INTEGER ms | |

**CHECK constraints (shipped):** valid JSON object payload; status enum; attempts ≥ 0; timestamp ordering; action_outcome_json object when present.

**Indexes (shipped):** `(status, scheduled_at)`, `(alarm_type, status)`, partial `(triggering_session_id) WHERE NOT NULL`.

**Spec drift:** `10-scheduled-alarms.md` documents a partial index `WHERE status = 'pending'` on `(status, scheduled_at)`. Shipped Drizzle uses a full composite index (see G15).

### Known alarm types (suggestions — not enforced at tool boundary)

From `10-scheduled-alarms.md` and related specs:

| Type | Typical trigger | Handler owner |
|---|---|---|
| `sickness_followup` | Agent after illness signal | **14** + health features |
| `travel_preload` | User mentions trip | **14** |
| `behavior_pattern_detection` | Recurring background pass | **12-brain-sub-agents** via **14** |
| `brain_maintenance_run` | Recurring maintenance pass | **12-brain-sub-agents** via **14** |
| `session_watchdog` | Session open | **11-brain-sessions-lifecycle** via **14** |
| `cooking_timer` | Cooking session timer | **29-cooking-session** (spec uses different payload shape — see G9) |

Types like `weekly_food_summary`, `scan_followup` appear in build-guide alarm table — treat as product intent for **14**, not as 09 tool constraints.

---

## Tool split layout (mandatory)

Same as **05**–**08**: four files per tool (`_schemas/`, `_prompts/`, `_executables/`, `.tool.ts`).

---

## Wake callback contract

Tools require injected `AlarmWakeCallbacks` from the Brain DO layer. Executables **never** call `ctx.storage.setAlarm()` directly.

```typescript
type AlarmWakeCallbacks = {
  scheduleAlarm: (scheduledAtMs: number) => Promise<void>  // MIN pending scheduled_at
  cancelAlarm:   () => Promise<void>                      // clear slot when no pending rows
}
```

Flow after every schedule or cancel:

1. Write SQLite row(s).
2. `readEarliestPendingScheduledAt(database, userId)`.
3. If row exists → `await wake.scheduleAlarm(next.scheduledAt)`.
4. If none remain (cancel path only) → `await wake.cancelAlarm()`.

`getBrainTools(..., wake?)` omits both alarm tools when `wake` is undefined.

**Shipped gap:** `BrioelaBrain` does not implement or pass wake callbacks yet (G1). Tools exist but are inert in live DO sessions until wired.

**Build-guide drift:** `05-alarm-system.md` shows per-alarm Agents SDK `schedule()` with `{ scheduledAlarmId }` and writes `sdk_schedule_id`. Production 09 tools use the MIN-pending callback pattern from implementable specs and tool protocol — not per-row SDK schedules (G6).

---

## Tool 1: `schedule_user_alarm`

**Purpose:** Insert a pending row and refresh the DO wake slot to the earliest pending `scheduled_at`.

**When:**

- User confirms a future event needing agent preparation (travel, medical followup)
- Agent detects a pattern warranting delayed check-in (sickness followup)
- Sub-agent reschedules `brain_maintenance_run` or `behavior_pattern_detection` (via forwarded tool — see scheduling conflict note below)
- DO initialization seeds first recurring alarms (direct `writeUserAlarm`, not necessarily this tool — **04** / **12**)

**When NOT:**

- Immediate event-triggered work → Upstash Workflow (Path B)
- `scheduled_at` in the past
- Duplicate pending row for dedup types (see below)

**Input:**

| Field | Required | Notes |
|---|---|---|
| `alarm_type` | yes | Free text, min length 1 |
| `scheduled_at` | yes | Unix ms — must be **future** (Zod refine + executable guard) |
| `payload` | no (default `{}`) | JSON object — handler parses at fire time |
| `triggering_session_id` | no | UUID of scheduling session; omit for system alarms |

**Dedup (shipped):** For `brain_maintenance_run` and `behavior_pattern_detection`, reject if a pending row of the same `alarm_type` already exists for the user.

```typescript
// DEDUP_USER_ALARM_TYPES in schedule.user.alarm.schema.ts
['brain_maintenance_run', 'behavior_pattern_detection']
```

One-off types (`sickness_followup`, `travel_preload`) allow multiple pending rows.

**Writes:** `writeUserAlarm` — status `pending`, payload JSON-stringified, `attempts: 0`.

**Returns (success):** `{ id, alarm_type, scheduled_at, status: 'pending' }`.

**Returns (dedup):** `{ error: 'alarm_already_pending', id, alarm_type, scheduled_at, hint }`.

**Returns (past time):** `{ error: 'scheduled_at_must_be_future', scheduled_at, now }` — executable-level guard in addition to Zod refine.

**Side effects:** Calls `wake.scheduleAlarm(MIN pending scheduled_at)` when any pending row exists after insert.

**Who can call (authoritative — `build-guide/05-brain/02-tool-protocol.md`):**

| Session kind | schedule |
|---|---|
| `chat` | ✓ |
| `cooking` | ✓ |
| `alarm` | ✗ |
| `brain_maintenance` | ✓ |
| `behavior_pattern_detection` | ✓ |

**Who (implementable tool spec prose):** Agent during active sessions; DO init for seeding. Spec line "NOT Brain maintenance — inserts directly in handler" **conflicts** with `15-brain-maintenance-and-behavior-patterns.md` which has sub-agents call `schedule_user_alarm` at run end — treat build-guide matrix + maintenance spec as authoritative (G11).

---

## Tool 2: `cancel_user_alarm`

**Purpose:** Set a pending alarm to `cancelled`, preserve row for audit, re-point or clear DO wake slot.

**When:**

- User cancels planned event (trip cancelled → cancel `travel_preload`)
- Condition resolved before fire (felt fine → cancel `sickness_followup`)
- Agent scheduled in error
- Session clean close cancels `session_watchdog` (**11** — not built)

**When NOT:**

- Status is `completed`, `failed`, or `processing`
- Alarm id unknown — agent must query pending rows by type first, never guess id

**Input:**

| Field | Required | Notes |
|---|---|---|
| `id` | yes | Alarm UUID |
| `reason` | no | Stored in `cancel_reason` when provided |

**Pre-guards:** Row exists; status must be `pending`.

**Writes:** `cancelUserAlarm` — status `cancelled`, `cancelled_at`, `cancel_reason`, `updated_at`.

**Returns (success):** `{ id, alarm_type, status: 'cancelled', was_next_alarm, new_next_alarm_at }`.

- `was_next_alarm`: cancelled row's `scheduled_at` equaled earliest pending before cancel.
- `new_next_alarm_at`: next MIN pending timestamp, or `null` if queue empty.

**Side effects:** Reschedule wake to next pending or `wake.cancelAlarm()` when queue empty.

**Who can call:**

| Session kind | cancel |
|---|---|
| `chat` | ✓ |
| `cooking` | ✓ |
| `alarm` | ✗ |
| `brain_maintenance` | ✗ |
| `behavior_pattern_detection` | ✗ |

Reschedule pattern for maintenance: cancel old + schedule new is agent-driven in chat/cooking contexts, or sub-agent uses schedule-only at end of run (next run queued before cancel of previous is needed only when rescheduling same type — dedup prevents duplicate pending).

---

## Repositories (shipped)

| Function | File | Role |
|---|---|---|
| `readUserAlarm` | `read.user.alarm.repository.ts` | By id |
| `readPendingUserAlarmByType` | same | Dedup lookup |
| `readEarliestPendingScheduledAt` | same | MIN pending for wake slot |
| `writeUserAlarm` | `write.user.alarm.repository.ts` | Insert |
| `cancelUserAlarm` | same | Cancel pending row |

No list-all-pending repository — agent reads via SQL in spec examples or future session prompt injection (**15**).

---

## Permission matrix (`SessionKind`)

**Authoritative:** `build-guide/05-brain/02-tool-protocol.md` + ledger `0004.alarm-tools.md`.

| Tool | chat | cooking | alarm | brain_maintenance | behavior_pattern_detection |
|---|---|---|---|---|---|
| `schedule_user_alarm` | ✓ | ✓ | ✗ | ✓ | ✓ |
| `cancel_user_alarm` | ✓ | ✓ | ✗ | ✗ | ✗ |

**Shipped production:** Matches build-guide for alarm tools (verified in `get.brain.tools.ts` and `alarm.tool.test.ts`).

**Conditional registration:** Both tools require `wake?: AlarmWakeCallbacks`. Without wake, permitted session kinds still filter them out at registration time.

---

## Feature boundary: 09 vs 14

| Concern | Feature |
|---|---|
| `schedule_user_alarm` / `cancel_user_alarm` tools | **09** |
| `scheduled_alarms` Drizzle schema + migration `0007` | **04** DDL, **09** tool semantics |
| Read/write alarm repositories for tools | **09** |
| `AlarmWakeCallbacks` type + executable wake calls | **09** contract |
| `getBrainTools` alarm registration | **09** |
| `BrioelaBrain` implementing `scheduleAlarm` / `cancelAlarm` | **09** gap G1 — blocks live tool use |
| `alarm()` / `runScheduledAlarm` / `dispatchAlarm` | **14** |
| Row lifecycle `processing` → `completed` / `failed` | **14** |
| Typed handler switch per `alarm_type` | **14** |
| `session_watchdog` insert on session open | **11** (uses repos; may call schedule tool or direct write) |
| First-boot seed `brain_maintenance_run` + `behavior_pattern_detection` | **04** init / **12** sub-agents — direct `writeUserAlarm`, not tool |
| Cooking timer `schedule_timer` | **29** — Mira DO; spec forwards to Brain with non-matching payload |
| Pending alarms in system prompt | **15-brain-system-prompt** |
| Live session handler passing `wake` into `getBrainTools` | **20-brain-chat-runtime** |

---

## Ledger drift warnings

- **`0004.alarm-tools.md`** — file list and permissions accurate; stop state says shipped; next action (wire wake in `BrioelaBrain`) still open → aligns with G1.
- **`0001.alarm-dispatch.md`** — open; references status `'fired'` which **does not exist** in schema (should be `completed`) — obsolete terminology (G16).

---

## Cross-feature boundaries

| Feature | Relationship |
|---|---|
| **04-brain-foundation** | `scheduled_alarms` in migration `0000`; `0007` adds `triggering_session_id` |
| **11-brain-sessions-lifecycle** | `session_watchdog` schedule/cancel on session open/close |
| **12-brain-sub-agents** | Maintenance/behavior sub-agents reschedule via `schedule_user_alarm` |
| **14-brain-alarm-dispatch** | Wake handler, dispatch, retries, outcome fields |
| **15-brain-system-prompt** | Pending alarm list in session context |
| **20-brain-chat-runtime** | Passes `wake` into `getBrainTools` |
| **29-cooking-session** | Timer spec references these tools with different field names |

---

## Sources

- `implementable-specs/10-scheduled-alarms.md`
- `implementable-specs/brioela-tools/11-schedule-user-alarm.md`
- `implementable-specs/brioela-tools/12-cancel-user-alarm.md`
- `implementable-specs/brioela-tools/00-index.md`
- `implementable-specs/00-overview.md`
- `implementable-specs/12-schema-version.md` (first-boot alarm seeding)
- `implementable-specs/13-gaps-and-missing-specs.md` (items 5, 8 closed elsewhere)
- `implementable-specs/15-brain-maintenance-and-behavior-patterns.md`
- `implementable-specs/17-session-lifecycle.md` (`session_watchdog`)
- `implementable-specs/cooking-session/06-timers.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `build-guide/05-brain/05-alarm-system.md`
- `_records/implementation-ledger/brain/03-tool-protocol/implementation/0004.alarm-tools.md`
- `_records/implementation-ledger/brain/06-alarm-system/0001.alarm-dispatch.md`
