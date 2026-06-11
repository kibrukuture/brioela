# Draft: 0004_rename_recipes_source_session_id.sql

Target: `backend/src/agents/brain/drizzle/0004_rename_recipes_source_session_id.sql`

```sql
ALTER TABLE `recipes` RENAME COLUMN `source_session` TO `source_session_id`;--> statement-breakpoint
DROP INDEX IF EXISTS `recipes_source_session_index`;--> statement-breakpoint
CREATE INDEX `recipes_source_session_id_index` ON `recipes` (`source_session_id`) WHERE source_session_id IS NOT NULL;
```
