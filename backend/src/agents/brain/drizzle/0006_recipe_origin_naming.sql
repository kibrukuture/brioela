ALTER TABLE `recipes` RENAME COLUMN `source` TO `origin`;--> statement-breakpoint
ALTER TABLE `recipes` RENAME COLUMN `source_session_id` TO `session_id`;--> statement-breakpoint
ALTER TABLE `recipes` RENAME COLUMN `source_url` TO `link_url`;--> statement-breakpoint
DROP INDEX IF EXISTS `recipes_source_created_at_index`;--> statement-breakpoint
DROP INDEX IF EXISTS `recipes_source_session_id_index`;--> statement-breakpoint
CREATE INDEX `recipes_origin_created_at_index` ON `recipes` (`origin`,`created_at`);--> statement-breakpoint
CREATE INDEX `recipes_session_id_index` ON `recipes` (`session_id`) WHERE session_id IS NOT NULL;
