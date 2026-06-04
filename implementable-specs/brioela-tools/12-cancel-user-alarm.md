# Tool: cancel_user_alarm

## Purpose

`cancel_user_alarm` sets a pending alarm's status to `cancelled` and immediately re-evaluates the DO alarm slot. If the cancelled alarm was the one the DO was sleeping towards, the slot must be updated to the next earliest pending row — or cleared entirely if no pending rows remain.

The row is never deleted. Cancelled alarms stay in `scheduled_alarms` permanently for audit history. The agent and developers can always see that an alarm was scheduled and then cancelled, when, and in what context.

## When to Call It

Call `cancel_user_alarm` when:
- The user cancels a planned event (trip cancelled → cancel travel_preload)
- The condition that triggered the alarm resolved before it fired (user felt fine the next hour → cancel sickness_followup)
- The agent scheduled an alarm in error and must correct it

Do NOT call `cancel_user_alarm` when:
- The alarm has already fired (status = 'completed' or 'failed') — there is nothing to cancel
- The alarm is currently processing (status = 'processing') — cancelling mid-execution is not safe; let it complete
- The alarm never existed — check before calling

## Input Schema

```typescript
import { z } from 'zod'

export const CancelUserAlarmSchema = z.object({
  id: z.string().uuid(),
  // The exact alarm row to cancel. From the id returned by schedule_user_alarm,
  // or from agent reading the scheduled_alarms table to find the relevant row.

  reason: z.string().min(1).optional(),
  // Why this alarm is being cancelled. Stored in fail_reason column for history.
  // Optional but recommended — a cancelled alarm with no reason is hard to audit later.
  // Examples:
  //   "User said trip was cancelled"
  //   "User reported feeling fine — sickness followup no longer needed"
  //   "Scheduled in error — wrong timestamp"
})
```

## Pre-Cancel Guards

```typescript
const alarm = db.select()
  .from(scheduledAlarms)
  .where(eq(scheduledAlarms.id, input.id))
  .get()

if (!alarm) {
  return { error: 'alarm_not_found', id: input.id }
}

if (alarm.status !== 'pending') {
  return {
    error: 'alarm_not_cancellable',
    id: input.id,
    current_status: alarm.status,
    hint: 'Only pending alarms can be cancelled. Status is: ' + alarm.status
  }
}
```

`processing` alarms cannot be cancelled — the DO is mid-execution. Wait for it to complete to `completed` or `failed` first.

## What It Writes

### Step 1 — Cancel the row

```typescript
db.update(scheduledAlarms)
  .set({
    status:    'cancelled',
    failReason: input.reason ?? null,
    updatedAt:  Date.now(),
  })
  .where(eq(scheduledAlarms.id, input.id))
  .run()
```

`failReason` is reused to store the cancellation reason — the column name is accurate enough; a cancelled row with a `fail_reason` describing why it was cancelled is readable and expected.

### Step 2 — Update DO alarm slot

After cancelling, immediately re-read the next earliest pending row and update the DO slot:

```typescript
const next = db.select({ scheduledFor: scheduledAlarms.scheduledFor })
  .from(scheduledAlarms)
  .where(eq(scheduledAlarms.status, 'pending'))
  .orderBy(asc(scheduledAlarms.scheduledFor))
  .limit(1)
  .get()

if (next) {
  await this.ctx.storage.setAlarm(next.scheduledFor)
} else {
  // No more pending alarms — clear the DO alarm slot entirely
  await this.ctx.storage.deleteAlarm()
}
```

This step is critical. If the cancelled alarm was the one the DO slot was pointing at, the DO would still wake up at that time, find no due work (it just got cancelled), and go back to sleep pointlessly. Resetting the slot immediately prevents this wasted wake-up.

If there are no more pending rows at all, `deleteAlarm()` clears the slot — the DO will not wake up until a new alarm is scheduled via `schedule_user_alarm`.

## What It Returns

On success:

```json
{
  "id": "a1b2c3d4-...",
  "alarm_type": "travel_preload",
  "status": "cancelled",
  "was_next_alarm": true,
  "new_next_alarm_at": 1748476800000
}
```

`was_next_alarm: true` signals that this alarm was the one the DO was sleeping towards — the slot has been updated.
`new_next_alarm_at` is the timestamp of the new earliest pending row. `null` if no pending rows remain (slot cleared).

## Side Effects

- DO alarm slot updated or cleared. No partial state — if the slot update fails after the row cancel, the alarm row stays cancelled but the slot may still have the old timestamp. The DO will wake up, find no due work, re-read the table, reset the slot, and go back to sleep. No data corruption, just one unnecessary wake-up.
- No other tables touched.

## Finding the Right Alarm ID

The agent does not always know the alarm ID from memory. To find the right alarm before cancelling:

```typescript
// Find all pending alarms of a given type
db.select()
  .from(scheduledAlarms)
  .where(
    and(
      eq(scheduledAlarms.status, 'pending'),
      eq(scheduledAlarms.alarmType, 'travel_preload')
    )
  )
  .all()
```

The agent reads the result, confirms the right row by `scheduled_for` and `payload_json` context, then calls `cancel_user_alarm` with the correct ID. Never guess an ID.

## Error Cases

| Error | Cause | What Agent Receives |
|---|---|---|
| Validation error | ID not a UUID, reason too short if provided | Zod error with failing field |
| Alarm not found | No row with this ID | `{ error: 'alarm_not_found', id }` |
| Not cancellable | Status is not 'pending' | `{ error: 'alarm_not_cancellable', id, current_status, hint }` |
| Write failure | SQLite error (rare) | Error message — alarm not cancelled |
| deleteAlarm failure | CF DO storage error (rare) | Error message — row cancelled but slot may not be cleared |

## Who Can Call It

- **Agent** — during any active session, when user cancels or condition resolves
- **NOT the Curator** — Curator does not cancel alarms
- **NOT device SDK** — tool-layer only

## What Is NOT This Tool's Job

- Scheduling a new alarm → `schedule_user_alarm`
- Rescheduling (cancelling and re-scheduling with new time) → cancel first, then schedule
- Deleting alarm history → never done; rows are permanent
- Cancelling alarms that are already processing → not safe; wait for completion
