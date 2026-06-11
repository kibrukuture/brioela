# Draft: 0007_scheduled_alarms_triggering_session_id.sql

Target: `backend/src/agents/brain/drizzle/0007_scheduled_alarms_triggering_session_id.sql`

```sql
ALTER TABLE `scheduled_alarms` ADD COLUMN `triggering_session_id` text;--> statement-breakpoint
CREATE INDEX `scheduled_alarms_triggering_session_id_index` ON `scheduled_alarms` (`triggering_session_id`) WHERE triggering_session_id IS NOT NULL;
```
