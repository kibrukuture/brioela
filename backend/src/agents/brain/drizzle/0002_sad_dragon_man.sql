PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_skill_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`skill_name` text NOT NULL,
	`user_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`description` text NOT NULL,
	`updated_by` text NOT NULL,
	`update_reason` text NOT NULL,
	`archived_at` integer NOT NULL,
	CONSTRAINT "skill_versions_version_check" CHECK("__new_skill_versions"."version" >= 1),
	CONSTRAINT "skill_versions_updated_by_check" CHECK("__new_skill_versions"."updated_by" in ('agent', 'brain_maintenance')),
	CONSTRAINT "skill_versions_archived_at_check" CHECK("__new_skill_versions"."archived_at" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_skill_versions`("id", "skill_name", "user_id", "version", "content", "description", "updated_by", "update_reason", "archived_at") SELECT "id", "skill_name", "user_id", "version", "content", '' as "description", 'agent' as "updated_by", "reason" as "update_reason", "archived_at" FROM `skill_versions`;--> statement-breakpoint
DROP TABLE `skill_versions`;--> statement-breakpoint
ALTER TABLE `__new_skill_versions` RENAME TO `skill_versions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `skill_versions_skill_name_version_index` ON `skill_versions` (`skill_name`,`version`);