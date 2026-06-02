CREATE TYPE "schnl"."crypto_network" AS ENUM('ethereum', 'polygon', 'base', 'solana', 'optimism', 'arbitrum', 'avalanche');--> statement-breakpoint
CREATE TABLE "schnl"."banking_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"network" "schnl"."crypto_network" DEFAULT 'ethereum' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banking_wallets_address_unique" UNIQUE("address"),
	CONSTRAINT "wallet_address_network_format" CHECK (
        (network = 'solana' AND address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$') OR
        (network != 'solana' AND address ~ '^0x[a-fA-F0-9]{40}$')
        )
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallets" ADD CONSTRAINT "banking_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE no action ON UPDATE no action;