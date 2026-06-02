CREATE TYPE "schnl"."banking_provider_transfer_mapping_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "schnl"."banking_provider_transfer_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"rail" "schnl"."banking_rail",
	"provider" text NOT NULL,
	"provider_transfer_id" text NOT NULL,
	"provider_tx_hash" text,
	"reference_type" "schnl"."banking_txn_reference_type" NOT NULL,
	"reference_id" uuid NOT NULL,
	"status" "schnl"."banking_provider_transfer_mapping_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_provider_transfer_mappings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP INDEX "schnl"."banking_transactions_provider_transfer_unique";--> statement-breakpoint
ALTER TABLE "schnl"."banking_provider_transfer_mappings" ADD CONSTRAINT "banking_provider_transfer_mappings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banking_provider_transfer_mappings_provider_transfer_unique" ON "schnl"."banking_provider_transfer_mappings" USING btree ("provider","provider_transfer_id") WHERE "schnl"."banking_provider_transfer_mappings"."provider_transfer_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" DROP COLUMN "provider";--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" DROP COLUMN "provider_transfer_id";