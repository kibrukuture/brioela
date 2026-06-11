# 003 — `scheduled_alarms` target time column mismatch

## Complaint
The alarm specification `implementable-specs/brioela-tools/11-schedule-user-alarm.md` and `12-cancel-user-alarm.md` expect the alarm execution target time to be stored in the column named `scheduled_for`.

However, the actual database schema in `backend/src/agents/brain/_schemas/scheduled.alarm.schema.ts` implements this column as:
```typescript
scheduledAt: integer('scheduled_at', { mode: 'number' }).notNull(),
```
There is no `scheduled_for` or `scheduledFor` column in the Drizzle schema.

## What Needs to Happen
We must decide whether to:
1. Update the specs, ledger entries, and tool executables to use `scheduledAt` (and `scheduled_at` in raw queries) instead of `scheduled_for`.
2. Or change the Drizzle schema `scheduled.alarm.schema.ts` to name this column `scheduledFor`.

## Why
TypeScript compilation and query runs will crash when trying to read/write `scheduledAlarms.scheduledFor`.

## Status
**FIXED.** Updated alarm table specification (`10-scheduled-alarms.md`), `schedule_user_alarm` tool spec (`11-schedule-user-alarm.md`), `cancel_user_alarm` tool spec (`12-cancel-user-alarm.md`), brain maintenance spec (`15-brain-maintenance-and-behavior-patterns.md`), load session context spec (`16-load-session-context.md`), and the implementation ledger (`0004.alarm-tools.md`) to use `scheduledAt`/`scheduled_at` to match the actual SQLite database schema.
