CREATE TYPE "schnl"."banking_offramp_outbox_status" AS ENUM('pending', 'in_progress', 'done', 'failed');--> statement-breakpoint
ALTER TYPE "schnl"."payout_status" ADD VALUE 'in_flight' BEFORE 'processing';--> statement-breakpoint
ALTER TYPE "schnl"."banking_peer_to_peer_transfer_status" ADD VALUE 'in_flight' BEFORE 'processing';--> statement-breakpoint
ALTER TYPE "schnl"."banking_pay_request_status" ADD VALUE 'in_flight' BEFORE 'processing';--> statement-breakpoint
CREATE TABLE "schnl"."banking_offramp_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_type" "schnl"."banking_txn_reference_type" NOT NULL,
	"reference_id" uuid NOT NULL,
	"payload" jsonb,
	"status" "schnl"."banking_offramp_outbox_status" DEFAULT 'pending' NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 8 NOT NULL,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"dedupe_key" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_offramp_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_external_accounts" ADD COLUMN "account_type" "schnl"."bank_account_type";--> statement-breakpoint
CREATE UNIQUE INDEX "banking_offramp_outbox_dedupe_key_unique" ON "schnl"."banking_offramp_outbox" USING btree ("dedupe_key") WHERE "schnl"."banking_offramp_outbox"."dedupe_key" IS NOT NULL;