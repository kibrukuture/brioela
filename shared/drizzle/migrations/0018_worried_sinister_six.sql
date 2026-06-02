CREATE TYPE "schnl"."session_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "schnl"."banking_wallet_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"session_key_address" text NOT NULL,
	"encrypted_session_key" text NOT NULL,
	"allowed_contracts" jsonb,
	"max_native_token_per_tx" text,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "schnl"."session_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banking_wallet_sessions_session_key_address_unique" UNIQUE("session_key_address")
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" ADD CONSTRAINT "banking_wallet_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" ADD CONSTRAINT "banking_wallet_sessions_wallet_id_banking_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "schnl"."banking_wallets"("id") ON DELETE no action ON UPDATE no action;