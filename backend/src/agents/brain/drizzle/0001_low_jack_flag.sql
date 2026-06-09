DROP INDEX `constraints_status_type_index`;--> statement-breakpoint
CREATE INDEX `constraints_type_status_index` ON `constraints` (`constraint_type`,`status`);--> statement-breakpoint
CREATE INDEX `constraints_surfaced_index` ON `constraints` (`last_surfaced_at`) WHERE status = 'proposed';--> statement-breakpoint
DROP INDEX `sessions_type_started_at_index`;--> statement-breakpoint
DROP INDEX `sessions_recipe_id_index`;--> statement-breakpoint
CREATE INDEX `sessions_type_status_started_at_index` ON `sessions` (`session_type`,`status`,`started_at`);--> statement-breakpoint
CREATE INDEX `sessions_parent_index` ON `sessions` (`parent_session_id`) WHERE parent_session_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX `sessions_recipe_index` ON `sessions` (`recipe_id`) WHERE recipe_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX `sessions_started_at_index` ON `sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `sessions_active_index` ON `sessions` (`status`) WHERE status = 'active';--> statement-breakpoint
CREATE INDEX `recipes_status_cook_count_index` ON `recipes` (`status`,`cook_count`);--> statement-breakpoint
CREATE INDEX `recipes_last_cooked_index` ON `recipes` (`last_cooked_at`) WHERE status = 'active';--> statement-breakpoint
CREATE INDEX `recipes_source_session_index` ON `recipes` (`source_session`) WHERE source_session IS NOT NULL;