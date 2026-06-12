# Draft: drizzle/0007_scheduled_alarms_triggering_session_id.sql

Target: `backend/src/agents/brain/drizzle/0007_scheduled_alarms_triggering_session_id.sql`

**Shipped (09 migration; 11 consumes).** Enables cancel lookup for `session_watchdog` by opening session id without JSON payload scan.

```sql
ALTER TABLE `scheduled_alarms` ADD COLUMN `triggering_session_id` text;--> statement-breakpoint
CREATE INDEX `scheduled_alarms_triggering_session_id_index` ON `scheduled_alarms` (`triggering_session_id`) WHERE triggering_session_id IS NOT NULL;
```

Used by `closeSession`:

```typescript
readPendingUserAlarmByType(db, userId, 'session_watchdog')
// OR
eq(scheduledAlarms.triggeringSessionId, sessionId)
```

Also documented in `_features/09-brain-alarm-tools/draft/drizzle.0007_scheduled_alarms_triggering_session_id.md`.
