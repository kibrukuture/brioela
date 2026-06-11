# 006 — `scheduled_alarms` cancellation/failure columns mismatch

## Complaint
The alarm specification `implementable-specs/brioela-tools/12-cancel-user-alarm.md` expects to write the cancellation reason to the column `failReason`.

However, the actual database schema in `backend/src/agents/brain/_schemas/scheduled.alarm.schema.ts` implements separate columns:
- `failureReason: text('failure_reason')`
- `cancelledAt: integer('cancelled_at')`
- `cancelReason: text('cancel_reason')`

There is no `failReason` column in the Drizzle schema.

## What Needs to Happen
We must decide whether to:
1. Update the cancel alarm tool to write to `cancelledAt = Date.now()` and `cancelReason = reason` (and write failures to `failureReason`) instead of reusing `failReason`.
2. Or change the Drizzle schema `scheduled.alarm.schema.ts` to replace the cancellation columns with `failReason`.

## Why
TypeScript compilation and query runs will crash when trying to read/write `scheduledAlarms.failReason`.

## Status
**FIXED.** Cancel tool and specs use `cancelledAt` + `cancelReason`; failures use `failureReason`. Implemented in `cancel.user.alarm.executable.ts` and synced across `10-scheduled-alarms.md`, `12-cancel-user-alarm.md`, `15-brain-maintenance-and-behavior-patterns.md`.
