CREATE TYPE "schnl"."banking_pay_request_status" AS ENUM('created', 'waiting_for_claim', 'claimed', 'expired', 'cancelled', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "schnl"."banking_ledger_entry_type" AS ENUM('credit', 'debit', 'hold', 'release');--> statement-breakpoint
CREATE TYPE "schnl"."banking_ledger_hold_status" AS ENUM('active', 'released', 'captured', 'expired');--> statement-breakpoint
CREATE TABLE "schnl"."challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purpose" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"user_id" uuid,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"consumed_by_user_id" uuid,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_pay_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"amount_atomic" bigint NOT NULL,
	"source_currency" "schnl"."banking_currency" NOT NULL,
	"payout_currency" "schnl"."banking_currency" NOT NULL,
	"status" "schnl"."banking_pay_request_status" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"claimed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"encrypted_payout_details" text,
	"payout_details_submitted_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_pay_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_ledger_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"balance_available_atomic" bigint DEFAULT 0 NOT NULL,
	"balance_held_atomic" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_ledger_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"type" "schnl"."banking_ledger_entry_type" NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_ledger_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_ledger_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"status" "schnl"."banking_ledger_hold_status" NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"released_at" timestamp with time zone,
	"captured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_ledger_holds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "amount_atomic" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "schnl"."challenges" ADD CONSTRAINT "challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."challenges" ADD CONSTRAINT "challenges_consumed_by_user_id_users_id_fk" FOREIGN KEY ("consumed_by_user_id") REFERENCES "schnl"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_pay_requests" ADD CONSTRAINT "banking_pay_requests_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_ledger_accounts" ADD CONSTRAINT "banking_ledger_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_ledger_entries" ADD CONSTRAINT "banking_ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_ledger_entries" ADD CONSTRAINT "banking_ledger_entries_account_id_banking_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "schnl"."banking_ledger_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_ledger_holds" ADD CONSTRAINT "banking_ledger_holds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_ledger_holds" ADD CONSTRAINT "banking_ledger_holds_account_id_banking_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "schnl"."banking_ledger_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banking_ledger_accounts_user_currency_unique" ON "schnl"."banking_ledger_accounts" USING btree ("user_id","currency");--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" DROP COLUMN "amount_decimal";