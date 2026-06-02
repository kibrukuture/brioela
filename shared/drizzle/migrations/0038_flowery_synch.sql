CREATE TYPE "schnl"."polling_job_status" AS ENUM('pending', 'in_progress', 'done', 'failed', 'expired');--> statement-breakpoint
CREATE TABLE "schnl"."polling_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"operation" text NOT NULL,
	"internal_id" text,
	"external_id" text,
	"context" jsonb,
	"payload" jsonb,
	"status" "schnl"."polling_job_status" DEFAULT 'pending' NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 8 NOT NULL,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ttl_expiry" timestamp with time zone NOT NULL,
	"last_error" text,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."polling_jobs" ENABLE ROW LEVEL SECURITY;