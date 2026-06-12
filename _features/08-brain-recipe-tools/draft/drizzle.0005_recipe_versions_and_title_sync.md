# Draft: drizzle.0005_recipe_versions_and_title_sync

Target: `backend/src/agents/brain/drizzle/0005_recipe_versions_and_title_sync.sql`

```sql
CREATE TABLE `__new_recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`source_session_id` text,
	`source_url` text,
	`content` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`cook_count` integer DEFAULT 0 NOT NULL,
	`last_cooked_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`confidence` real DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "recipes_content_json_object_check" CHECK(json_valid("__new_recipes"."content") and json_type("__new_recipes"."content") = 'object'),
	CONSTRAINT "recipes_title_matches_content_check" CHECK(json_extract("__new_recipes"."content", '$.title') = "__new_recipes"."title"),
	CONSTRAINT "recipes_version_check" CHECK("__new_recipes"."version" >= 1),
	CONSTRAINT "recipes_cook_count_check" CHECK("__new_recipes"."cook_count" >= 0),
	CONSTRAINT "recipes_last_cooked_at_check" CHECK("__new_recipes"."last_cooked_at" is null or "__new_recipes"."last_cooked_at" >= 0),
	CONSTRAINT "recipes_status_check" CHECK("__new_recipes"."status" in ('active', 'archived')),
	CONSTRAINT "recipes_confidence_check" CHECK("__new_recipes"."confidence" >= 0 and "__new_recipes"."confidence" <= 1),
	CONSTRAINT "recipes_created_at_check" CHECK("__new_recipes"."created_at" >= 0),
	CONSTRAINT "recipes_updated_at_check" CHECK("__new_recipes"."updated_at" >= "__new_recipes"."created_at")
);
--> statement-breakpoint
INSERT INTO `__new_recipes`("id", "user_id", "title", "source", "source_session_id", "source_url", "content", "version", "cook_count", "last_cooked_at", "status", "confidence", "created_at", "updated_at") SELECT "id", "user_id", "title", "source", "source_session_id", "source_url", "content", 1, "cook_count", "last_cooked_at", "status", "confidence", "created_at", "updated_at" FROM `recipes`;--> statement-breakpoint
DROP TABLE `recipes`;--> statement-breakpoint
ALTER TABLE `__new_recipes` RENAME TO `recipes`;--> statement-breakpoint
CREATE INDEX `recipes_user_status_last_cooked_at_index` ON `recipes` (`user_id`,`status`,`last_cooked_at`);--> statement-breakpoint
CREATE INDEX `recipes_source_created_at_index` ON `recipes` (`source`,`created_at`);--> statement-breakpoint
CREATE INDEX `recipes_status_cook_count_index` ON `recipes` (`status`,`cook_count`);--> statement-breakpoint
CREATE INDEX `recipes_last_cooked_index` ON `recipes` (`last_cooked_at`) WHERE status = 'active';--> statement-breakpoint
CREATE INDEX `recipes_source_session_id_index` ON `recipes` (`source_session_id`) WHERE source_session_id IS NOT NULL;--> statement-breakpoint
CREATE TABLE `recipe_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`recipe_id` text NOT NULL,
	`user_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`updated_by` text NOT NULL,
	`update_reason` text NOT NULL,
	`archived_at` integer NOT NULL,
	CONSTRAINT "recipe_versions_version_check" CHECK("recipe_versions"."version" >= 1),
	CONSTRAINT "recipe_versions_updated_by_check" CHECK("recipe_versions"."updated_by" in ('agent', 'brain_maintenance')),
	CONSTRAINT "recipe_versions_archived_at_check" CHECK("recipe_versions"."archived_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `recipe_versions_recipe_id_version_index` ON `recipe_versions` (`recipe_id`,`version`);
```
