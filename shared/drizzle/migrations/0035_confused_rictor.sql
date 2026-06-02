CREATE TYPE "schnl"."banking_kyc_status" AS ENUM('not_started', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "schnl"."banking_kyc_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_kyc_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."users" ADD COLUMN "banking_kyc_status" "schnl"."banking_kyc_status" DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "schnl"."users" ADD COLUMN "banking_kyc_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schnl"."banking_kyc_events" ADD CONSTRAINT "banking_kyc_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;