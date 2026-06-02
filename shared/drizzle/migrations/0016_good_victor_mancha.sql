CREATE TYPE "schnl"."banking_account_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "schnl"."bank_account_type" AS ENUM('checking', 'savings');--> statement-breakpoint
CREATE TYPE "schnl"."banking_currency" AS ENUM('usd', 'eur', 'aed', 'aud', 'cad', 'dkk', 'hkd', 'jpy', 'nzd', 'nok', 'gbp', 'sgd', 'sek', 'chf', 'usdc', 'usdt', 'eurc', 'dai', 'wbtc', 'eth');--> statement-breakpoint
CREATE TYPE "schnl"."banking_rail" AS ENUM('ach', 'wire', 'sepa', 'swift', 'uaefts', 'internal');--> statement-breakpoint
CREATE TYPE "schnl"."banking_card_brand" AS ENUM('mastercard', 'visa');--> statement-breakpoint
CREATE TYPE "schnl"."banking_card_status" AS ENUM('active', 'frozen', 'cancelled', 'pending');--> statement-breakpoint
CREATE TYPE "schnl"."banking_card_type" AS ENUM('virtual', 'physical');--> statement-breakpoint
CREATE TYPE "schnl"."holder_type" AS ENUM('individual', 'business');--> statement-breakpoint
CREATE TYPE "schnl"."banking_txn_direction" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "schnl"."banking_txn_status" AS ENUM('pending', 'completed', 'failed', 'declined');--> statement-breakpoint
CREATE TYPE "schnl"."banking_txn_type" AS ENUM('deposit', 'withdrawal', 'card_payment', 'transfer_in', 'transfer_out', 'fee');--> statement-breakpoint
CREATE TABLE "schnl"."banking_virtual_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"bank_name" text,
	"iban" text,
	"bic" text,
	"account_number" text,
	"routing_number" text,
	"sort_code" text,
	"status" "schnl"."banking_account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "virtual_iban_format" CHECK (iban IS NULL OR iban ~ '^[A-Z]{2}[0-9A-Z]{13,32}$'),
	CONSTRAINT "virtual_bic_format" CHECK (bic IS NULL OR bic ~ '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$'),
	CONSTRAINT "virtual_routing_format" CHECK (routing_number IS NULL OR routing_number ~ '^[0-9]{9}$'),
	CONSTRAINT "virtual_sort_code_format" CHECK (sort_code IS NULL OR sort_code ~ '^[0-9]{6}$')
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_virtual_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_external_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_holder_name" text NOT NULL,
	"account_holder_type" "schnl"."holder_type" NOT NULL,
	"country_code" text NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"iban" text,
	"bic" text,
	"account_number" text,
	"routing_number" text,
	"sort_code" text,
	"street_line1" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "external_iban_format" CHECK (iban IS NULL OR iban ~ '^[A-Z]{2}[0-9A-Z]{13,32}$'),
	CONSTRAINT "external_bic_format" CHECK (bic IS NULL OR bic ~ '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$'),
	CONSTRAINT "external_routing_format" CHECK (routing_number IS NULL OR routing_number ~ '^[0-9]{9}$'),
	CONSTRAINT "external_sort_code_format" CHECK (sort_code IS NULL OR sort_code ~ '^[0-9]{6}$')
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_external_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_crypto_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"wallet_address" text NOT NULL,
	"chain_network" text,
	"token_symbol" "schnl"."banking_currency",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_crypto_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"type" "schnl"."banking_card_type" NOT NULL,
	"status" "schnl"."banking_card_status" DEFAULT 'pending' NOT NULL,
	"brand" "schnl"."banking_card_brand" DEFAULT 'mastercard' NOT NULL,
	"last_4" text NOT NULL,
	"expiry_month" integer NOT NULL,
	"expiry_year" integer NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"wallet_address" text,
	"label" text,
	"theme" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "schnl"."banking_txn_type" NOT NULL,
	"direction" "schnl"."banking_txn_direction" NOT NULL,
	"status" "schnl"."banking_txn_status" NOT NULL,
	"amount_decimal" numeric(20, 6) NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"rail" "schnl"."banking_rail",
	"provider_id" text,
	"description" text,
	"card_id" uuid,
	"virtual_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_virtual_accounts" ADD CONSTRAINT "banking_virtual_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_external_accounts" ADD CONSTRAINT "banking_external_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_crypto_contacts" ADD CONSTRAINT "banking_crypto_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_cards" ADD CONSTRAINT "banking_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD CONSTRAINT "banking_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD CONSTRAINT "banking_transactions_card_id_banking_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "schnl"."banking_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD CONSTRAINT "banking_transactions_virtual_account_id_banking_virtual_accounts_id_fk" FOREIGN KEY ("virtual_account_id") REFERENCES "schnl"."banking_virtual_accounts"("id") ON DELETE no action ON UPDATE no action;