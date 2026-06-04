# Table: scheduled_alarms

## Why This Table Exists

The Cloudflare Durable Object has one built-in alarm slot — one pending timestamp at a time. Setting a new alarm overwrites the previous one. A single user can have multiple alarms pending simultaneously: a sickness followup due tomorrow morning, a travel preload due before their flight, a Curator pass due Sunday night. One slot cannot hold four alarms.

`scheduled_alarms` is the queue. The DO alarm slot is only the wake-up clock. When the DO wakes up, it reads this table to find all due work, processes it, then sets the DO alarm slot to the next earliest pending row. The table is the brain. The slot is the trigger.

## The DO Alarm Pattern

```
1. Agent calls schedule_alarm(type, scheduled_for, payload)
2. Row inserted into scheduled_alarms with status = 'pending'
3. DO alarm slot set to MIN(scheduled_for) across all pending rows
4. DO sleeps

5. DO wakes up when alarm fires
6. Reads all rows WHERE status = 'pending' AND scheduled_for <= now()
7. Sets each row to status = 'processing'
8. Processes each row — spawns the appropriate agent action
9. Sets each completed row to status = 'completed'
10. Reads MIN(scheduled_for) of remaining pending rows
11. Sets DO alarm slot to that timestamp
12. DO sleeps again
```

If step 8 fails: row stays at `status = 'processing'`, `attempts` incremented. Next wake-up retries it.

## Alarm Types

**`sickness_followup`** — user reported feeling unwell or a pattern was detected suggesting foodborne illness. Alarm fires 4–24 hours later. Agent checks in: how are you feeling, do you want to file the illness detective report now.

**`travel_preload`** — user has a trip detected (from calendar event or explicit mention). Alarm fires before departure. Agent pre-loads destination food context, dietary restriction compatibility for local cuisine, known safe options.

**`recall_check`** — a product the user has previously scanned or purchased has been flagged in a recall database. Alarm fires to surface the notification immediately.

**`pattern_detection`** — periodic background pass. Agent scans recent `memory_event` entries for emerging patterns not yet captured in `user_memory` or `user_personality`. Scheduled weekly or after a threshold of new events.

**`curator_run`** — scheduled Curator maintenance pass. Evaluates skill staleness, personality trait decay, constraint resurfacing candidates. Typically weekly.

## CREATE TABLE

```sql
CREATE TABLE scheduled_alarms (
  id               TEXT PRIMARY KEY,   -- UUID v4
  user_id          TEXT NOT NULL,      -- owner — self-describing for export
  alarm_type       TEXT NOT NULL,      -- 'sickness_followup' | 'travel_preload' | 'recall_check' | 'pattern_detection' | 'curator_run'
  status           TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  scheduled_for    INTEGER NOT NULL,   -- unix timestamp ms — when this alarm should fire
  payload_json     TEXT NOT NULL DEFAULT '{}',  -- JSON — context the alarm handler needs when it wakes up
  triggering_session_id TEXT,          -- which session scheduled this alarm — NULL for system-scheduled alarms
  attempts         INTEGER NOT NULL DEFAULT 0,   -- how many processing attempts have been made
  last_attempted_at INTEGER,           -- unix timestamp ms — when the last attempt was made
  completed_at     INTEGER,            -- unix timestamp ms — when this alarm successfully completed
  fail_reason      TEXT,               -- why it failed — NULL unless status = 'failed'
  created_at       INTEGER NOT NULL,   -- unix timestamp ms
  updated_at       INTEGER NOT NULL    -- unix timestamp ms
);
```

## Drizzle Schema

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const scheduledAlarms = sqliteTable('scheduled_alarms', {
  id:                   text('id').primaryKey(),
  userId:               text('user_id').notNull(),
  alarmType:            text('alarm_type').notNull(),      // free text — Zod enforces known values
  status:               text('status').notNull().default('pending'),
  scheduledFor:         integer('scheduled_for').notNull(),
  payloadJson:          text('payload_json').notNull().default('{}'),
  triggeringSessionId:  text('triggering_session_id'),
  attempts:             integer('attempts').notNull().default(0),
  lastAttemptedAt:      integer('last_attempted_at'),
  completedAt:          integer('completed_at'),
  failReason:           text('fail_reason'),
  createdAt:            integer('created_at').notNull(),
  updatedAt:            integer('updated_at').notNull(),
})
```

## Column Decisions

**`alarm_type` — free text, Zod-enforced**
Five known types. No SQL enum — new alarm types can be added without a migration. Zod at the `schedule_alarm` tool boundary enforces the known set.

**`status` — five states**
- `pending` — waiting to fire
- `processing` — DO woke up and is currently handling this alarm. Prevents double-processing if something goes wrong mid-execution.
- `completed` — handled successfully, `completed_at` set
- `failed` — all retry attempts exhausted, `fail_reason` set
- `cancelled` — explicitly cancelled before it fired (e.g. user left the trip, sickness resolved)

**`scheduled_for` — unix timestamp ms**
The target fire time. The DO alarm slot is always set to `MIN(scheduled_for) WHERE status = 'pending'`. When the DO wakes up, it queries `WHERE status = 'pending' AND scheduled_for <= now()` — everything due now or overdue.

**`payload_json` — context for the alarm handler**
What the handler needs when it wakes up — without this, the handler has no context for why it was scheduled. Examples:
- `sickness_followup`: `{ "memory_event_ids": ["..."], "symptoms_reported": "felt nauseous after dinner" }`
- `travel_preload`: `{ "destination": "Addis Ababa", "departure_at": 1234567890 }`
- `recall_check`: `{ "product_barcode": "...", "product_name": "..." }`
- `pattern_detection` and `curator_run`: `{}`

**`triggering_session_id` — nullable**
Which session scheduled this alarm. NULL for system-scheduled alarms (pattern_detection, curator_run). Set for agent-triggered alarms (sickness_followup triggered mid-chat, travel_preload triggered when user mentions a trip).

**`attempts` + `last_attempted_at` — retry tracking**
If processing fails, `attempts` increments and the alarm is retried on the next DO wake-up. Max attempts enforced in handler logic (e.g. 3). After max attempts: `status = 'failed'`, `fail_reason` written.

**`completed_at` vs `updated_at`**
`completed_at` is NULL until the alarm successfully completes — `WHERE completed_at IS NULL AND status != 'cancelled'` finds all unresolved alarms. `updated_at` tracks any row change for audit.

## Zod Schema (Tool Boundary)

```typescript
import { z } from 'zod'

const ScheduleAlarmSchema = z.object({
  alarm_type:    z.enum(['sickness_followup', 'travel_preload', 'recall_check', 'pattern_detection', 'curator_run']),
  scheduled_for: z.number().int().positive(),
  payload:       z.record(z.unknown()).default({}),
})

const CancelAlarmSchema = z.object({
  id: z.string().uuid(),
})
```

## Indexes

```sql
CREATE INDEX idx_alarms_pending      ON scheduled_alarms (status, scheduled_for ASC) WHERE status = 'pending';
CREATE INDEX idx_alarms_type_status  ON scheduled_alarms (alarm_type, status);
```

**Why these indexes:**
- `(status, scheduled_for ASC)` partial on pending — the critical query: find the next alarm to fire and all currently due alarms. This runs every time the DO wakes up.
- `(alarm_type, status)` — find all pending curator_run alarms, check if one already exists before scheduling another duplicate.

## Write Rules

- `schedule_alarm` tool — agent only. Inserts with `status = 'pending'`. After insert, calls `this.ctx.storage.setAlarm(MIN scheduled_for)` to ensure the DO slot is updated.
- DO alarm handler — sets `status = 'processing'` before handling. Sets `status = 'completed'` or `status = 'failed'` after. Increments `attempts` on each try. After all rows processed, re-reads `MIN(scheduled_for)` of remaining pending rows and resets DO alarm slot.
- `cancel_alarm` tool — agent only. Sets `status = 'cancelled'`. After cancel, re-reads `MIN(scheduled_for)` and resets DO alarm slot.
- Never deleted. History of all past alarms stays in the table.

## Read Rules

- Read by DO alarm handler on every wake-up: `WHERE status = 'pending' AND scheduled_for <= now()`.
- Read before scheduling a new `curator_run` or `pattern_detection` to check if one is already pending — prevent duplicates.
- Read by agent to tell the user what alarms are currently set: "you have a sickness followup scheduled for tomorrow morning."

## What Is NOT Stored Here

- The alarm session that ran when the alarm fired → `sessions` (alarm session row)
- The events that triggered the alarm → `memory_event`
- Agent metadata and counters → `agent_state`
