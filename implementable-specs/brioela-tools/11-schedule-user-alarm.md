# Tool: schedule_user_alarm

## Purpose

`schedule_user_alarm` inserts a new row into `scheduled_alarms` with `status = 'pending'` and then updates the DO alarm slot to the earliest pending scheduled time. The DO alarm slot is a one-slot wake-up clock — this tool keeps it pointed at the right timestamp after every new alarm is added.

This tool is exclusively for time-based autonomous work: things that must fire at a specific future timestamp. It is NOT for event-based work. Event-based autonomous work (product recall detected, condition threshold met, step A → step B immediately) flows through Upstash Workflow (Path B) and never touches this table. If you are scheduling something that should fire "right now" or "immediately when condition X is true," this is the wrong tool.

## When to Call It

Call `schedule_user_alarm` when:
- User mentions or confirms a future event that requires agent preparation (travel, medical followup)
- Agent detects a pattern that warrants a delayed check-in (user felt unwell — schedule sickness followup for 6 hours later)
- A `brain_maintenance_run` or `behavior_pattern_detection` pass is due and none is currently pending

Do NOT call `schedule_user_alarm` when:
- The work should happen immediately on event detection → Upstash Workflow (Path B)
- A pending alarm of the same type already exists and is not yet cancelled or completed
- The `scheduled_at` timestamp is in the past

## Duplicate Check Before Scheduling

For recurring alarm types (`brain_maintenance_run`, `behavior_pattern_detection`), the agent must check before scheduling:

```typescript
const existing = db.select()
  .from(scheduledAlarms)
  .where(
    and(
      eq(scheduledAlarms.alarmType, input.alarm_type),
      eq(scheduledAlarms.status, 'pending')
    )
  )
  .get()

if (existing) {
  return {
    error: 'alarm_already_pending',
    id: existing.id,
    alarm_type: input.alarm_type,
    scheduled_at: existing.scheduledAt,
    hint: 'A pending alarm of this type already exists. Cancel it first if you need to reschedule.'
  }
}
```

For user-specific one-off alarms (`sickness_followup`, `travel_preload`), the agent uses judgment — a user can have multiple sickness followups pending if they had multiple illness events.

## Input Schema

```typescript
import { z } from 'zod'

export const ScheduleUserAlarmSchema = z.object({
  alarm_type: z.string().min(1),
  // Free text — not an enum. Known types at launch: 'sickness_followup', 'travel_preload',
  // 'behavior_pattern_detection', 'brain_maintenance_run'. New types are added by writing a new handler branch.
  // No Zod enum update needed when adding new types.

  scheduled_at: z.number().int().positive(),
  // Unix timestamp ms — when this alarm should fire.
  // Must be in the future. The tool validates this before inserting.

  payload: z.record(z.unknown()).default({}),
  // Context the handler will need when the DO wakes up.
  // Structured as the handler requires — no enforced shape here, handler parses at runtime.
  // Examples by alarm type:
  //   sickness_followup:  { memory_event_ids: ["..."], symptoms_reported: "nausea after dinner" }
  //   travel_preload:     { destination: "Addis Ababa", departure_at: 1748390400000 }
  //   behavior_pattern_detection:  {}
  //   brain_maintenance_run:        {}

  triggering_session_id: z.uuid().optional(),
  // The session that scheduled this alarm. Pass the current session_id.
  // NULL for system-scheduled alarms (e.g. recurring behavior_pattern_detection at DO init).
})
.refine(
  (data) => data.scheduled_at > Date.now(),
  { message: 'scheduled_at must be a future timestamp', path: ['scheduled_at'] }
)
```

## What It Writes

### Step 1 — Insert into scheduled_alarms

```typescript
const id = crypto.randomUUID()
const now = Date.now()

db.insert(scheduledAlarms).values({
  id,
  userId:              ctx.userId,
  alarmType:           input.alarm_type,
  status:              'pending',
  scheduledAt:          input.scheduled_at,
  payload:             JSON.stringify(input.payload),
  triggeringSessionId: input.triggering_session_id ?? null,
  attempts:            0,
  lastAttemptedAt:     null,
  completedAt:         null,
  failReason:          null,
  createdAt:           now,
  updatedAt:           now,
}).run()
```

### Step 2 — Update DO alarm slot

After inserting, immediately read the earliest pending scheduled_at across all pending rows and set the DO alarm slot:

```typescript
const next = db.select({ scheduledAt: scheduledAlarms.scheduledAt })
  .from(scheduledAlarms)
  .where(eq(scheduledAlarms.status, 'pending'))
  .orderBy(asc(scheduledAlarms.scheduledAt))
  .limit(1)
  .get()

if (next) {
  await this.ctx.storage.setAlarm(next.scheduledAt)
}
```

This is critical. Without step 2, the DO never wakes up for the new alarm. The slot is always pointed at the earliest pending row — adding a new row that is earlier than the current slot is automatically handled by this read-and-set pattern.

## What It Returns

On success:

```json
{
  "id": "a1b2c3d4-...",
  "alarm_type": "sickness_followup",
  "scheduled_at": 1748390400000,
  "status": "pending"
}
```

The agent can report the scheduled alarm to the user: "I've set a check-in for 6 hours from now to see how you are feeling."

## Side Effects

- DO alarm slot updated to `MIN(scheduled_at)` across all pending rows. If this new alarm is earlier than what was previously set, the DO will now wake up earlier.
- No other tables touched.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | scheduled_at in the past, alarm_type empty, payload not a record | Zod error with failing field |
| Alarm already pending | Same alarm_type has a pending row (for dedup types) | `{ error: 'alarm_already_pending', id, alarm_type, scheduled_at, hint }` |
| Write failure | SQLite error (rare) | Error message |
| setAlarm failure | CF DO storage error (rare) | Error message — alarm row inserted but slot not updated |

## Who Can Call It

- **Agent** — during any active session
- **DO initialization** — for seeding first `brain_maintenance_run` and `behavior_pattern_detection` alarms (with `triggering_session_id: null`)
- **NOT the Brain maintenance** — the Brain maintenance reschedules itself by inserting a new alarm row directly in the handler, not through this tool
- **NOT device SDK**

## What Is NOT This Tool's Job

- Event-triggered immediate work → Upstash Workflow (Path B)
- Cancelling a pending alarm → `cancel_user_alarm`
- Processing alarms on wake-up → DO alarm handler logic (not a tool)
- Scheduling system-level recurring alarms at first DO boot → DO initialization code, not a tool
