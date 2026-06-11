# Table: scheduled_alarms

## Why This Table Exists

The Cloudflare Durable Object has one built-in alarm slot — one pending timestamp at a time. Setting a new alarm overwrites the previous one. A single user can have multiple alarms pending simultaneously: a sickness followup due tomorrow morning, a travel preload due before their flight, a Brain maintenance pass due Sunday night. One slot cannot hold multiple alarms.

`scheduled_alarms` is the queue. The DO alarm slot is only the wake-up clock. When the DO wakes up, it reads this table to find all due work, processes it, then sets the DO alarm slot to the next earliest pending row. The table is the brain. The slot is the trigger.

## Design Decision: Two Trigger Paths for Autonomous Work

Not all autonomous agent work is time-based. There are two fundamentally different triggering mechanisms in Brioela and they must not be confused:

**Path A — Time-based (this table)**
```
agent calls schedule_user_alarm(type, scheduled_at, payload)
→ row inserted into scheduled_alarms with status = 'pending'
→ DO alarm slot set to MIN(scheduled_at) across all pending rows
→ DO sleeps until that timestamp
→ DO wakes up, reads table, processes all due rows
→ creates an 'alarm' session
```

**Path B — Event-based (Upstash Workflow)**
```
external event fires — product scanned, condition threshold met, step A completed
→ Upstash Workflow triggers itself
→ calls DO HTTP endpoint directly with event context
→ DO handles it immediately as a 'background' session
→ scheduled_alarms table is never touched
→ DO alarm slot is never involved
```

Upstash Workflow is completely outside the DO alarm system. It fires itself when event conditions are met. The DO does not know it is coming — it just receives an HTTP call. No row in `scheduled_alarms`, no alarm slot, no queue. The work happens immediately when the event fires.

`scheduled_alarms` is ONLY for work that must fire at a specific future timestamp. Event-based work never goes here.

## Alarm Types — Suggestions, Not a Fixed List

The alarm types listed below are known starting points. They are NOT hardcoded. New alarm types will be added as the product grows — adding one requires no schema migration and no Zod enum change. `alarm_type` is free text. The Zod schema validates format (non-empty string), not a fixed list. The handler dispatches on the value at runtime.

Known time-based alarm types at launch:

**`sickness_followup`** — user reported feeling unwell or a pattern was detected suggesting foodborne illness. Alarm fires 4–24 hours later. Agent checks in: how are you feeling, do you want to file the illness detective report now. This is time-based — the event triggers the scheduling, but the actual work fires later.

**`travel_preload`** — user has a trip detected (from calendar event or explicit mention). Alarm fires before departure timestamp. Agent pre-loads destination food context, dietary restriction compatibility for local cuisine, known safe options.

**`behavior_pattern_detection`** — periodic background pass. Agent scans recent `memory_event` entries for emerging patterns not yet captured in `user_memory` or `user_personality`. Typically weekly.

**`brain_maintenance_run`** — scheduled Brain maintenance maintenance pass. Evaluates skill staleness, personality trait decay, constraint resurfacing candidates. Typically weekly.

**What does NOT belong here — `recall_check` example:**
A product recall notification fires the moment the condition is detected — not at a scheduled future time. That is event-based: product scanned → recall database checked → if recalled → notify immediately. This flows through Upstash Workflow (Path B), creates a `background` session directly, and never touches this table.

## The DO Alarm Pattern (Path A detail)

```
1. Agent calls schedule_user_alarm(type, scheduled_at, payload)
2. Row inserted into scheduled_alarms with status = 'pending'
3. DO alarm slot set to MIN(scheduled_at) across all pending rows
4. DO sleeps

5. DO wakes up when alarm fires
6. Reads all rows WHERE status = 'pending' AND scheduled_at <= now()
7. Sets each row to status = 'processing'
8. Processes each row — dispatches on alarm_type, spawns agent action
9. Sets each completed row to status = 'completed'
10. Reads MIN(scheduled_at) of remaining pending rows
11. Sets DO alarm slot to that timestamp
12. DO sleeps again
```

If step 8 fails: row stays at `status = 'processing'`, `attempts` incremented. Next wake-up retries it.

## CREATE TABLE

```sql
CREATE TABLE scheduled_alarms (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL,
  alarm_type            TEXT NOT NULL,
  triggering_session_id TEXT,
  payload               TEXT NOT NULL DEFAULT '{}',
  sdk_schedule_id       TEXT,
  status                TEXT NOT NULL DEFAULT 'pending',
  attempts              INTEGER NOT NULL DEFAULT 0,
  failure_reason        TEXT,
  cancelled_at          INTEGER,
  cancel_reason         TEXT,
  rescheduled_from_alarm_id TEXT,
  rescheduled_to_alarm_id   TEXT,
  label                 TEXT,
  scheduled_at          INTEGER NOT NULL,
  started_at            INTEGER,
  completed_at          INTEGER,
  action_outcome_status TEXT,
  action_outcome_json   TEXT,
  created_at            INTEGER NOT NULL,
  updated_at            INTEGER NOT NULL,
  CHECK (json_valid(payload) AND json_type(payload) = 'object'),
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  CHECK (attempts >= 0),
  CHECK (cancelled_at IS NULL OR cancelled_at >= 0),
  CHECK (scheduled_at >= 0),
  CHECK (started_at IS NULL OR started_at >= scheduled_at),
  CHECK (completed_at IS NULL OR completed_at >= scheduled_at),
  CHECK (action_outcome_json IS NULL OR (json_valid(action_outcome_json) AND json_type(action_outcome_json) = 'object')),
  CHECK (created_at >= 0),
  CHECK (updated_at >= created_at)
);
```

## Drizzle Schema

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const scheduledAlarms = sqliteTable('scheduled_alarms', {
  id:                   text('id').primaryKey(),
  userId:               text('user_id').notNull(),
  alarmType:            text('alarm_type').notNull(),
  triggeringSessionId:  text('triggering_session_id'),
  payload:              text('payload').notNull(),
  sdkScheduleId:        text('sdk_schedule_id'),
  status:               text('status').notNull().default('pending'),
  attempts:             integer('attempts').notNull().default(0),
  failureReason:        text('failure_reason'),
  cancelledAt:          integer('cancelled_at'),
  cancelReason:         text('cancel_reason'),
  rescheduledFromAlarmId: text('rescheduled_from_alarm_id'),
  rescheduledToAlarmId:   text('rescheduled_to_alarm_id'),
  label:                text('label'),
  scheduledAt:          integer('scheduled_at').notNull(),
  startedAt:            integer('started_at'),
  completedAt:          integer('completed_at'),
  actionOutcomeStatus:  text('action_outcome_status'),
  actionOutcomeJson:    text('action_outcome_json'),
  createdAt:            integer('created_at').notNull(),
  updatedAt:            integer('updated_at').notNull(),
}, (table) => [
  index('scheduled_alarms_status_scheduled_at_index').on(table.status, table.scheduledAt),
  index('scheduled_alarms_type_status_index').on(table.alarmType, table.status),
  index('scheduled_alarms_triggering_session_id_index').on(table.triggeringSessionId).where(sql`triggering_session_id IS NOT NULL`),
])
```

## Column Decisions

**`alarm_type` — free text, not an enum**
Known values are documented above as suggestions. The handler dispatches on this string at runtime. New alarm types are added by writing a new handler branch — no schema change, no Zod enum update. Zod validates that the string is non-empty, nothing more.

**`status` — five states**
- `pending` — waiting to fire
- `processing` — DO is currently handling this alarm. Prevents double-processing if something goes wrong mid-execution.
- `completed` — handled successfully, `completed_at` set
- `failed` — all retry attempts exhausted, `failure_reason` set
- `cancelled` — explicitly cancelled before it fired (`cancelled_at`, `cancel_reason` set)

**`scheduled_at` — unix timestamp ms**
The target fire time. The DO alarm slot is always set to `MIN(scheduled_at) WHERE status = 'pending'`. When the DO wakes up: `WHERE status = 'pending' AND scheduled_at <= now()` — everything due now or overdue gets processed in one wake-up.

**`payload` — context for the handler**
What the handler needs when it wakes up. Without this, the handler has no context for why it was scheduled. Examples:
- `sickness_followup`: `{ "memory_event_ids": ["..."], "symptoms_reported": "felt nauseous after dinner" }`
- `travel_preload`: `{ "destination": "Addis Ababa", "departure_at": 1234567890 }`
- `behavior_pattern_detection`, `brain_maintenance_run`: `{}`

**`triggering_session_id` — nullable**
Which session scheduled this alarm. NULL for system-scheduled alarms (behavior_pattern_detection, brain_maintenance_run). Set for agent-triggered alarms (sickness_followup triggered mid-chat, travel_preload triggered when user mentions a trip).

**`attempts` + `started_at` — retry tracking**
If processing fails, `attempts` increments and the alarm is retried on the next wake-up. Max retry count enforced in handler logic. After max attempts: `status = 'failed'`, `failure_reason` written. `started_at` records when processing began.

**`completed_at` vs `updated_at`**
`completed_at` is NULL until the alarm successfully completes — `WHERE completed_at IS NULL AND status != 'cancelled'` finds all unresolved alarms. `updated_at` tracks any row change for audit.

## Zod Schema (Tool Boundary)

```typescript
import { z } from 'zod'

const ScheduleAlarmSchema = z.object({
  alarm_type:    z.string().min(1),          // free text — not an enum
  scheduled_at:  z.number().int().positive(),
  payload:       z.record(z.unknown()).default({}),
})

const CancelAlarmSchema = z.object({
  id: z.uuid(),
})
```

## Indexes

```sql
CREATE INDEX idx_alarms_pending      ON scheduled_alarms (status, scheduled_at ASC) WHERE status = 'pending';
CREATE INDEX idx_alarms_type_status  ON scheduled_alarms (alarm_type, status);
```

**Why these indexes:**
- `(status, scheduled_at ASC)` partial on pending — the critical query: find the next alarm to fire and all currently due alarms. Runs every DO wake-up.
- `(alarm_type, status)` — check if a pending brain_maintenance_run or behavior_pattern_detection already exists before scheduling a duplicate.

## Write Rules

- `schedule_user_alarm` tool — agent only. Inserts with `status = 'pending'`. After insert, calls injected `scheduleAlarm(MIN scheduled_at)` to update the DO wake slot.
- DO alarm handler — sets `status = 'processing'` before handling. Sets `status = 'completed'` or `status = 'failed'` after. Increments `attempts` on each attempt. After all rows processed, re-reads `MIN(scheduled_at)` of remaining pending rows and calls `scheduleAlarm` or `cancelAlarm`.
- `cancel_user_alarm` tool — agent only. Sets `status = 'cancelled'`, `cancelled_at`, `cancel_reason`. After cancel, re-reads `MIN(scheduled_at)` and calls `scheduleAlarm` or `cancelAlarm`.
- Never deleted. History of all past alarms stays in the table permanently.

## Read Rules

- Read by DO alarm handler on every wake-up: `WHERE status = 'pending' AND scheduled_at <= now()`.
- Read before scheduling a new `brain_maintenance_run` or `behavior_pattern_detection` to check if one is already pending — prevent duplicates.
- Read by agent to tell the user what alarms are set: "you have a sickness followup scheduled for tomorrow morning."

## What Is NOT Stored Here

- Event-based work (recall notifications, immediate event chains) → Upstash Workflow, creates `background` session directly
- The session that ran when the alarm fired → `sessions` (alarm session row)
- The events that triggered the alarm → `memory_event`
- Agent metadata and counters → `agent_state`
