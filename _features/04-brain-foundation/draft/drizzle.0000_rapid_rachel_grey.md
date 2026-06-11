# Draft: 0000_rapid_rachel_grey.sql

Target: `backend/src/agents/brain/drizzle/0000_rapid_rachel_grey.sql`

```sql
CREATE TABLE `agent_state` (
	`key` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "agent_state_value_json_check" CHECK(json_valid("agent_state"."value")),
	CONSTRAINT "agent_state_updated_at_check" CHECK("agent_state"."updated_at" >= 0)
);
--> statement-breakpoint
CREATE TABLE `constraints` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`constraint_type` text NOT NULL,
	`entity_kind` text NOT NULL,
	`entity_value` text NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`confidence` real DEFAULT 0.5 NOT NULL,
	`evidence` text DEFAULT '[]' NOT NULL,
	`surfaced_count` integer DEFAULT 0 NOT NULL,
	`last_surfaced_at` integer,
	`confirmation_source` text,
	`notes` text,
	`proposed_at` integer NOT NULL,
	`confirmed_at` integer,
	`updated_at` integer NOT NULL,
	CONSTRAINT "constraints_constraint_type_check" CHECK("constraints"."constraint_type" in ('hard_allergy', 'intolerance', 'dislike', 'dietary_identity', 'boycott')),
	CONSTRAINT "constraints_entity_kind_check" CHECK("constraints"."entity_kind" in ('ingredient', 'category', 'brand', 'place')),
	CONSTRAINT "constraints_status_check" CHECK("constraints"."status" in ('proposed', 'confirmed', 'auto_confirmed', 'rejected')),
	CONSTRAINT "constraints_confirmation_source_check" CHECK("constraints"."confirmation_source" is null or "constraints"."confirmation_source" in ('user_explicit', 'behavioral_threshold')),
	CONSTRAINT "constraints_evidence_json_array_check" CHECK(json_valid("constraints"."evidence") and json_type("constraints"."evidence") = 'array'),
	CONSTRAINT "constraints_confidence_check" CHECK("constraints"."confidence" >= 0 and "constraints"."confidence" <= 1),
	CONSTRAINT "constraints_surfaced_count_check" CHECK("constraints"."surfaced_count" >= 0),
	CONSTRAINT "constraints_last_surfaced_at_check" CHECK("constraints"."last_surfaced_at" is null or "constraints"."last_surfaced_at" >= 0),
	CONSTRAINT "constraints_proposed_at_check" CHECK("constraints"."proposed_at" >= 0),
	CONSTRAINT "constraints_confirmed_at_check" CHECK("constraints"."confirmed_at" is null or "constraints"."confirmed_at" >= "constraints"."proposed_at"),
	CONSTRAINT "constraints_updated_at_check" CHECK("constraints"."updated_at" >= "constraints"."proposed_at")
);
--> statement-breakpoint
CREATE INDEX `constraints_type_status_index` ON `constraints` (`constraint_type`,`status`);--> statement-breakpoint
CREATE INDEX `constraints_entity_status_index` ON `constraints` (`entity_kind`,`entity_value`,`status`);--> statement-breakpoint
CREATE INDEX `constraints_surfaced_index` ON `constraints` (`last_surfaced_at`) WHERE status = 'proposed';--> statement-breakpoint
CREATE TABLE `memory_event` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload_json` text NOT NULL,
	`captured_at` integer NOT NULL,
	`ingested_at` integer NOT NULL,
	`source` text NOT NULL,
	`session_id` text,
	`entity_kind` text,
	`entity_id` text,
	`geo_hash` text,
	CONSTRAINT "memory_event_payload_json_object_check" CHECK(json_valid("memory_event"."payload_json") and json_type("memory_event"."payload_json") = 'object'),
	CONSTRAINT "memory_event_captured_at_check" CHECK("memory_event"."captured_at" >= 0),
	CONSTRAINT "memory_event_ingested_at_check" CHECK("memory_event"."ingested_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `memory_event_kind_captured_at_index` ON `memory_event` (`kind`,`captured_at`);--> statement-breakpoint
CREATE INDEX `memory_event_entity_captured_at_index` ON `memory_event` (`entity_kind`,`entity_id`,`captured_at`);--> statement-breakpoint
CREATE INDEX `memory_event_captured_at_id_index` ON `memory_event` (`captured_at`,`id`);--> statement-breakpoint
CREATE INDEX `memory_event_session_id_index` ON `memory_event` (`session_id`);--> statement-breakpoint
CREATE TABLE `migration_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`migration_id` text NOT NULL,
	`from_version` integer NOT NULL,
	`to_version` integer NOT NULL,
	`phase` text NOT NULL,
	`risk` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`status` text NOT NULL,
	`attempt` integer NOT NULL,
	`error_json` text,
	`deployment_id` text NOT NULL,
	CONSTRAINT "migration_runs_phase_check" CHECK("migration_runs"."phase" in ('expand', 'dual_write', 'backfill', 'verify', 'contract')),
	CONSTRAINT "migration_runs_risk_check" CHECK("migration_runs"."risk" in ('low', 'medium', 'high', 'blocked')),
	CONSTRAINT "migration_runs_status_check" CHECK("migration_runs"."status" in ('started', 'applied', 'smoke_passed', 'failed', 'blocked')),
	CONSTRAINT "migration_runs_from_version_check" CHECK("migration_runs"."from_version" >= 0),
	CONSTRAINT "migration_runs_to_version_check" CHECK("migration_runs"."to_version" >= "migration_runs"."from_version"),
	CONSTRAINT "migration_runs_started_at_check" CHECK("migration_runs"."started_at" >= 0),
	CONSTRAINT "migration_runs_finished_at_check" CHECK("migration_runs"."finished_at" is null or "migration_runs"."finished_at" >= "migration_runs"."started_at"),
	CONSTRAINT "migration_runs_attempt_check" CHECK("migration_runs"."attempt" >= 1),
	CONSTRAINT "migration_runs_error_json_check" CHECK("migration_runs"."error_json" is null or json_valid("migration_runs"."error_json"))
);
--> statement-breakpoint
CREATE INDEX `migration_runs_migration_started_at_index` ON `migration_runs` (`migration_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `migration_runs_status_started_at_index` ON `migration_runs` (`status`,`started_at`);--> statement-breakpoint
CREATE TABLE `migration_smoke_results` (
	`id` text PRIMARY KEY NOT NULL,
	`migration_run_id` text NOT NULL,
	`smoke` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`error_json` text,
	CONSTRAINT "migration_smoke_results_status_check" CHECK("migration_smoke_results"."status" in ('passed', 'failed')),
	CONSTRAINT "migration_smoke_results_started_at_check" CHECK("migration_smoke_results"."started_at" >= 0),
	CONSTRAINT "migration_smoke_results_finished_at_check" CHECK("migration_smoke_results"."finished_at" is null or "migration_smoke_results"."finished_at" >= "migration_smoke_results"."started_at"),
	CONSTRAINT "migration_smoke_results_error_json_check" CHECK("migration_smoke_results"."error_json" is null or json_valid("migration_smoke_results"."error_json"))
);
--> statement-breakpoint
CREATE INDEX `migration_smoke_results_migration_run_id_index` ON `migration_smoke_results` (`migration_run_id`);--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`source_session` text,
	`source_url` text,
	`content` text NOT NULL,
	`cook_count` integer DEFAULT 0 NOT NULL,
	`last_cooked_at` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`confidence` real DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "recipes_content_json_object_check" CHECK(json_valid("recipes"."content") and json_type("recipes"."content") = 'object'),
	CONSTRAINT "recipes_cook_count_check" CHECK("recipes"."cook_count" >= 0),
	CONSTRAINT "recipes_last_cooked_at_check" CHECK("recipes"."last_cooked_at" is null or "recipes"."last_cooked_at" >= 0),
	CONSTRAINT "recipes_status_check" CHECK("recipes"."status" in ('active', 'archived')),
	CONSTRAINT "recipes_confidence_check" CHECK("recipes"."confidence" >= 0 and "recipes"."confidence" <= 1),
	CONSTRAINT "recipes_created_at_check" CHECK("recipes"."created_at" >= 0),
	CONSTRAINT "recipes_updated_at_check" CHECK("recipes"."updated_at" >= "recipes"."created_at")
);
--> statement-breakpoint
CREATE INDEX `recipes_user_status_last_cooked_at_index` ON `recipes` (`user_id`,`status`,`last_cooked_at`);--> statement-breakpoint
CREATE INDEX `recipes_source_created_at_index` ON `recipes` (`source`,`created_at`);--> statement-breakpoint
CREATE INDEX `recipes_status_cook_count_index` ON `recipes` (`status`,`cook_count`);--> statement-breakpoint
CREATE INDEX `recipes_last_cooked_index` ON `recipes` (`last_cooked_at`) WHERE status = 'active';--> statement-breakpoint
CREATE INDEX `recipes_source_session_index` ON `recipes` (`source_session`) WHERE source_session IS NOT NULL;--> statement-breakpoint
CREATE TABLE `scheduled_alarms` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`alarm_type` text NOT NULL,
	`payload` text NOT NULL,
	`sdk_schedule_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`failure_reason` text,
	`cancelled_at` integer,
	`cancel_reason` text,
	`rescheduled_from_alarm_id` text,
	`rescheduled_to_alarm_id` text,
	`label` text,
	`scheduled_at` integer NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`action_outcome_status` text,
	`action_outcome_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "scheduled_alarms_payload_json_object_check" CHECK(json_valid("scheduled_alarms"."payload") and json_type("scheduled_alarms"."payload") = 'object'),
	CONSTRAINT "scheduled_alarms_status_check" CHECK("scheduled_alarms"."status" in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
	CONSTRAINT "scheduled_alarms_attempts_check" CHECK("scheduled_alarms"."attempts" >= 0),
	CONSTRAINT "scheduled_alarms_cancelled_at_check" CHECK("scheduled_alarms"."cancelled_at" is null or "scheduled_alarms"."cancelled_at" >= 0),
	CONSTRAINT "scheduled_alarms_scheduled_at_check" CHECK("scheduled_alarms"."scheduled_at" >= 0),
	CONSTRAINT "scheduled_alarms_started_at_check" CHECK("scheduled_alarms"."started_at" is null or "scheduled_alarms"."started_at" >= "scheduled_alarms"."scheduled_at"),
	CONSTRAINT "scheduled_alarms_completed_at_check" CHECK("scheduled_alarms"."completed_at" is null or "scheduled_alarms"."completed_at" >= "scheduled_alarms"."scheduled_at"),
	CONSTRAINT "scheduled_alarms_action_outcome_json_object_check" CHECK("scheduled_alarms"."action_outcome_json" is null or (json_valid("scheduled_alarms"."action_outcome_json") and json_type("scheduled_alarms"."action_outcome_json") = 'object')),
	CONSTRAINT "scheduled_alarms_created_at_check" CHECK("scheduled_alarms"."created_at" >= 0),
	CONSTRAINT "scheduled_alarms_updated_at_check" CHECK("scheduled_alarms"."updated_at" >= "scheduled_alarms"."created_at")
);
--> statement-breakpoint
CREATE INDEX `scheduled_alarms_status_scheduled_at_index` ON `scheduled_alarms` (`status`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `scheduled_alarms_type_status_index` ON `scheduled_alarms` (`alarm_type`,`status`);--> statement-breakpoint
CREATE TABLE `schema_readiness` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`schema_version` integer NOT NULL,
	`min_readable_version` integer NOT NULL,
	`target_version` integer NOT NULL,
	`status` text NOT NULL,
	`last_migration_id` text,
	`last_smoke_status` text,
	`last_error_json` text,
	`updated_at` integer NOT NULL,
	CONSTRAINT "schema_readiness_schema_version_check" CHECK("schema_readiness"."schema_version" >= 0),
	CONSTRAINT "schema_readiness_min_readable_version_check" CHECK("schema_readiness"."min_readable_version" >= 0),
	CONSTRAINT "schema_readiness_target_version_check" CHECK("schema_readiness"."target_version" >= "schema_readiness"."min_readable_version"),
	CONSTRAINT "schema_readiness_status_check" CHECK("schema_readiness"."status" in ('ready', 'migrating', 'blocked_by_control_plane', 'needs_retry', 'migration_failed', 'read_only_degraded', 'incompatible_code')),
	CONSTRAINT "schema_readiness_last_smoke_status_check" CHECK("schema_readiness"."last_smoke_status" is null or "schema_readiness"."last_smoke_status" in ('passed', 'failed')),
	CONSTRAINT "schema_readiness_last_error_json_check" CHECK("schema_readiness"."last_error_json" is null or json_valid("schema_readiness"."last_error_json")),
	CONSTRAINT "schema_readiness_updated_at_check" CHECK("schema_readiness"."updated_at" >= 0)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_type` text NOT NULL,
	`parent_session_id` text,
	`recipe_id` text,
	`alarm_type` text,
	`status` text DEFAULT 'active' NOT NULL,
	`outcome_summary` text,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`cache_read_tokens` integer DEFAULT 0 NOT NULL,
	`cache_write_tokens` integer DEFAULT 0 NOT NULL,
	`estimated_cost_usd` real,
	`turn_count` integer DEFAULT 0 NOT NULL,
	`skills_created` integer DEFAULT 0 NOT NULL,
	`constraints_proposed` integer DEFAULT 0 NOT NULL,
	`memory_writes` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`end_reason` text,
	CONSTRAINT "sessions_session_type_check" CHECK("sessions"."session_type" in ('chat', 'cooking', 'alarm', 'background')),
	CONSTRAINT "sessions_status_check" CHECK("sessions"."status" in ('active', 'completed', 'compressed', 'abandoned')),
	CONSTRAINT "sessions_input_tokens_check" CHECK("sessions"."input_tokens" >= 0),
	CONSTRAINT "sessions_output_tokens_check" CHECK("sessions"."output_tokens" >= 0),
	CONSTRAINT "sessions_cache_read_tokens_check" CHECK("sessions"."cache_read_tokens" >= 0),
	CONSTRAINT "sessions_cache_write_tokens_check" CHECK("sessions"."cache_write_tokens" >= 0),
	CONSTRAINT "sessions_estimated_cost_usd_check" CHECK("sessions"."estimated_cost_usd" is null or "sessions"."estimated_cost_usd" >= 0),
	CONSTRAINT "sessions_turn_count_check" CHECK("sessions"."turn_count" >= 0),
	CONSTRAINT "sessions_skills_created_check" CHECK("sessions"."skills_created" >= 0),
	CONSTRAINT "sessions_constraints_proposed_check" CHECK("sessions"."constraints_proposed" >= 0),
	CONSTRAINT "sessions_memory_writes_check" CHECK("sessions"."memory_writes" >= 0),
	CONSTRAINT "sessions_started_at_check" CHECK("sessions"."started_at" >= 0),
	CONSTRAINT "sessions_ended_at_check" CHECK("sessions"."ended_at" is null or "sessions"."ended_at" >= "sessions"."started_at")
);
--> statement-breakpoint
CREATE INDEX `sessions_user_status_started_at_index` ON `sessions` (`user_id`,`status`,`started_at`);--> statement-breakpoint
CREATE INDEX `sessions_type_status_started_at_index` ON `sessions` (`session_type`,`status`,`started_at`);--> statement-breakpoint
CREATE INDEX `sessions_parent_index` ON `sessions` (`parent_session_id`) WHERE parent_session_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX `sessions_recipe_index` ON `sessions` (`recipe_id`) WHERE recipe_id IS NOT NULL;--> statement-breakpoint
CREATE INDEX `sessions_started_at_index` ON `sessions` (`started_at`);--> statement-breakpoint
CREATE INDEX `sessions_active_index` ON `sessions` (`status`) WHERE status = 'active';--> statement-breakpoint
CREATE TABLE `session_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`turn_number` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`tool_name` text,
	`tool_input` text,
	`tool_result` text,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT "session_turns_turn_number_check" CHECK("session_turns"."turn_number" >= 1),
	CONSTRAINT "session_turns_role_check" CHECK("session_turns"."role" in ('user', 'assistant', 'tool_call', 'tool_result')),
	CONSTRAINT "session_turns_input_tokens_check" CHECK("session_turns"."input_tokens" >= 0),
	CONSTRAINT "session_turns_output_tokens_check" CHECK("session_turns"."output_tokens" >= 0),
	CONSTRAINT "session_turns_created_at_check" CHECK("session_turns"."created_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `session_turns_session_turn_number_index` ON `session_turns` (`session_id`,`turn_number`);--> statement-breakpoint
CREATE INDEX `session_turns_user_created_at_index` ON `session_turns` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `skills` (
	`name` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`description` text NOT NULL,
	`content` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`use_count` integer DEFAULT 0 NOT NULL,
	`last_used_at` integer,
	`archived_reason` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "skills_tags_json_array_check" CHECK(json_valid("skills"."tags") and json_type("skills"."tags") = 'array'),
	CONSTRAINT "skills_source_check" CHECK("skills"."source" in ('system', 'user')),
	CONSTRAINT "skills_status_check" CHECK("skills"."status" in ('active', 'stale', 'archived')),
	CONSTRAINT "skills_version_check" CHECK("skills"."version" >= 1),
	CONSTRAINT "skills_use_count_check" CHECK("skills"."use_count" >= 0),
	CONSTRAINT "skills_last_used_at_check" CHECK("skills"."last_used_at" is null or "skills"."last_used_at" >= 0),
	CONSTRAINT "skills_created_at_check" CHECK("skills"."created_at" >= 0),
	CONSTRAINT "skills_updated_at_check" CHECK("skills"."updated_at" >= "skills"."created_at")
);
--> statement-breakpoint
CREATE INDEX `skills_status_use_count_index` ON `skills` (`status`,`use_count`);--> statement-breakpoint
CREATE INDEX `skills_source_status_index` ON `skills` (`source`,`status`);--> statement-breakpoint
CREATE INDEX `skills_last_used_at_index` ON `skills` (`last_used_at`);--> statement-breakpoint
CREATE TABLE `skill_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`skill_name` text NOT NULL,
	`user_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`reason` text NOT NULL,
	`archived_at` integer NOT NULL,
	CONSTRAINT "skill_versions_version_check" CHECK("skill_versions"."version" >= 1),
	CONSTRAINT "skill_versions_archived_at_check" CHECK("skill_versions"."archived_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `skill_versions_skill_name_version_index` ON `skill_versions` (`skill_name`,`version`);--> statement-breakpoint
CREATE TABLE `user_memory` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`namespace` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`confidence` real DEFAULT 1 NOT NULL,
	`source` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`importance` integer DEFAULT 5 NOT NULL,
	`read_count` integer DEFAULT 0 NOT NULL,
	`write_count` integer DEFAULT 0 NOT NULL,
	`last_read` integer,
	`last_write` integer,
	`updated_at` integer NOT NULL,
	CONSTRAINT "user_memory_namespace_starts_with_letter_check" CHECK("user_memory"."namespace" GLOB '[a-z]*'),
	CONSTRAINT "user_memory_namespace_chars_check" CHECK("user_memory"."namespace" NOT GLOB '*[^a-z0-9.]*'),
	CONSTRAINT "user_memory_namespace_no_consecutive_dots_check" CHECK("user_memory"."namespace" NOT LIKE '%..%'),
	CONSTRAINT "user_memory_namespace_no_trailing_dot_check" CHECK("user_memory"."namespace" NOT LIKE '%.'),
	CONSTRAINT "user_memory_namespace_max_depth_check" CHECK((length("user_memory"."namespace") - length(replace("user_memory"."namespace", '.', ''))) <= 2),
	CONSTRAINT "user_memory_namespace_segment_starts_with_letter_check" CHECK("user_memory"."namespace" NOT GLOB '*.[0-9]*'),
	CONSTRAINT "user_memory_key_starts_with_letter_check" CHECK("user_memory"."key" GLOB '[a-z]*'),
	CONSTRAINT "user_memory_key_chars_check" CHECK("user_memory"."key" NOT GLOB '*[^a-z0-9_]*'),
	CONSTRAINT "user_memory_value_json_object_check" CHECK(json_valid("user_memory"."value") and json_type("user_memory"."value") = 'object'),
	CONSTRAINT "user_memory_confidence_check" CHECK("user_memory"."confidence" >= 0 and "user_memory"."confidence" <= 1),
	CONSTRAINT "user_memory_is_active_check" CHECK("user_memory"."is_active" in (0, 1)),
	CONSTRAINT "user_memory_importance_check" CHECK("user_memory"."importance" >= 1 and "user_memory"."importance" <= 10),
	CONSTRAINT "user_memory_read_count_check" CHECK("user_memory"."read_count" >= 0),
	CONSTRAINT "user_memory_write_count_check" CHECK("user_memory"."write_count" >= 0),
	CONSTRAINT "user_memory_last_read_check" CHECK("user_memory"."last_read" is null or "user_memory"."last_read" >= 0),
	CONSTRAINT "user_memory_last_write_check" CHECK("user_memory"."last_write" is null or "user_memory"."last_write" >= 0),
	CONSTRAINT "user_memory_updated_at_check" CHECK("user_memory"."updated_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `user_memory_namespace_is_active_index` ON `user_memory` (`namespace`,`is_active`);--> statement-breakpoint
CREATE INDEX `user_memory_is_active_last_write_index` ON `user_memory` (`is_active`,`last_write`);--> statement-breakpoint
CREATE INDEX `user_memory_source_index` ON `user_memory` (`source`);--> statement-breakpoint
CREATE TABLE `user_personality` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`trait` text NOT NULL,
	`summary` text NOT NULL,
	`evidence` text NOT NULL,
	`strength` real NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`revised_count` integer DEFAULT 0 NOT NULL,
	`inferred_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "user_personality_evidence_json_array_check" CHECK(json_valid("user_personality"."evidence") and json_type("user_personality"."evidence") = 'array'),
	CONSTRAINT "user_personality_strength_check" CHECK("user_personality"."strength" >= 0 and "user_personality"."strength" <= 1),
	CONSTRAINT "user_personality_is_active_check" CHECK("user_personality"."is_active" in (0, 1)),
	CONSTRAINT "user_personality_revised_count_check" CHECK("user_personality"."revised_count" >= 0),
	CONSTRAINT "user_personality_inferred_at_check" CHECK("user_personality"."inferred_at" >= 0),
	CONSTRAINT "user_personality_last_seen_at_check" CHECK("user_personality"."last_seen_at" >= "user_personality"."inferred_at"),
	CONSTRAINT "user_personality_updated_at_check" CHECK("user_personality"."updated_at" >= "user_personality"."inferred_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_personality_trait_unique` ON `user_personality` (`trait`);--> statement-breakpoint
CREATE INDEX `user_personality_is_active_strength_index` ON `user_personality` (`is_active`,`strength`);--> statement-breakpoint
CREATE INDEX `user_personality_last_seen_at_index` ON `user_personality` (`last_seen_at`);```
