# 004 — `scheduled_alarms` payload column mismatch

## Complaint
The alarm specification `implementable-specs/brioela-tools/11-schedule-user-alarm.md` refers to `payloadJson` as the column where the alarm payload is stored.

However, the actual database schema in `backend/src/agents/brain/_schemas/scheduled.alarm.schema.ts` implements this column as:
```typescript
payload: text('payload').notNull(),
```
It is called `payload` in the database, not `payloadJson` (or `payload_json`).

## What Needs to Happen
We must decide whether to:
1. Update the specs and tools to read/write `payload` instead of `payloadJson`.
2. Or change the Drizzle schema in `scheduled.alarm.schema.ts` to rename `payload` to `payloadJson`.

## Why
TypeScript compilation and query runs will crash when trying to read/write `scheduledAlarms.payloadJson`.

## Status
**OPEN.**
