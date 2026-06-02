CREATE TYPE "schnl"."banking_txn_reference_type" AS ENUM('pay_request', 'outgoing_payout', 'peer_to_peer', 'card_top_up', 'crypto_send', 'bank_transfer');--> statement-breakpoint
CREATE TABLE "schnl"."banking_outgoing_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"status" "schnl"."payout_status" DEFAULT 'created' NOT NULL,
	"destination_external_account_id" uuid,
	"encrypted_destination_bank_details" text,
	"provider_transfer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destination_check" CHECK ("schnl"."banking_outgoing_payouts"."destination_external_account_id" IS NOT NULL OR "schnl"."banking_outgoing_payouts"."encrypted_destination_bank_details" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_outgoing_payouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_external_accounts" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "reference_type" "schnl"."banking_txn_reference_type";--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "reference_id" uuid;--> statement-breakpoint
ALTER TABLE "schnl"."banking_outgoing_payouts" ADD CONSTRAINT "banking_outgoing_payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_outgoing_payouts" ADD CONSTRAINT "banking_outgoing_payouts_destination_external_account_id_banking_external_accounts_id_fk" FOREIGN KEY ("destination_external_account_id") REFERENCES "schnl"."banking_external_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banking_external_accounts_user_label_unique" ON "schnl"."banking_external_accounts" USING btree ("user_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_transactions_provider_transfer_unique" ON "schnl"."banking_transactions" USING btree ("provider","provider_transfer_id");--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" DROP COLUMN "provider_id";