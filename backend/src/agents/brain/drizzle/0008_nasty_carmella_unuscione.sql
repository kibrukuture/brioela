DROP INDEX `recipes_source_created_at_index`;--> statement-breakpoint
DROP INDEX `recipes_source_session_id_index`;--> statement-breakpoint
ALTER TABLE `recipes` ADD `origin` text NOT NULL;--> statement-breakpoint
ALTER TABLE `recipes` ADD `session_id` text;--> statement-breakpoint
ALTER TABLE `recipes` ADD `link_url` text;--> statement-breakpoint
CREATE INDEX `recipes_origin_created_at_index` ON `recipes` (`origin`,`created_at`);--> statement-breakpoint
CREATE INDEX `recipes_session_id_index` ON `recipes` (`session_id`) WHERE session_id IS NOT NULL;--> statement-breakpoint
ALTER TABLE `recipes` DROP COLUMN `source`;--> statement-breakpoint
ALTER TABLE `recipes` DROP COLUMN `source_session_id`;--> statement-breakpoint
ALTER TABLE `recipes` DROP COLUMN `source_url`;--> statement-breakpoint
ALTER TABLE `scheduled_alarms` ADD `triggering_session_id` text;--> statement-breakpoint
ALTER TABLE `scheduled_alarms` ADD `dedup_key` text;--> statement-breakpoint
CREATE INDEX `scheduled_alarms_triggering_session_id_index` ON `scheduled_alarms` (`triggering_session_id`) WHERE triggering_session_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX `scheduled_alarms_user_dedup_key_index` ON `scheduled_alarms` (`user_id`,`dedup_key`) WHERE dedup_key IS NOT NULL;