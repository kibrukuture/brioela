# 005 — `scheduled_alarms` triggering session ID mismatch

## Complaint
The alarm specification `implementable-specs/brioela-tools/11-schedule-user-alarm.md` references a column named `triggeringSessionId` (or `triggering_session_id`) to record which session scheduled the alarm.

However, the actual database schema in `backend/src/agents/brain/_schemas/scheduled.alarm.schema.ts` does not contain the `triggeringSessionId` or `triggering_session_id` column.

## What Needs to Happen
We must decide whether to:
1. Update the Drizzle schema in `scheduled.alarm.schema.ts` and generate a migration to add `triggeringSessionId: text('triggering_session_id')`.
2. Or update the specs and tool definitions to drop tracking of the triggering session ID.

## Why
TypeScript compilation and query runs will crash when trying to read/write `scheduledAlarms.triggeringSessionId`.

## Status
**OPEN.**
