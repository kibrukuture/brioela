CREATE TYPE "brioela"."account_access_status" AS ENUM('blocked', 'unblocked');--> statement-breakpoint
CREATE TYPE "brioela"."banking_kyc_status" AS ENUM('not_started', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "brioela"."payment_status" AS ENUM('active', 'trialing', 'past_due', 'cancelled', 'expired', 'paused', 'pending', 'failed', 'refunded', 'partially_refunded', 'incomplete');--> statement-breakpoint
CREATE TYPE "brioela"."subscription_platform" AS ENUM('APP_STORE', 'PLAY_STORE', 'STRIPE', 'PADDLE');--> statement-breakpoint
CREATE TYPE "brioela"."subscription_tier" AS ENUM('monthly', 'yearly', 'lifetime', 'weekly');--> statement-breakpoint
CREATE TYPE "brioela"."notification_provider" AS ENUM('expo', 'apns', 'fcm');--> statement-breakpoint
CREATE TYPE "brioela"."banking_account_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TYPE "brioela"."bank_account_type" AS ENUM('checking', 'savings');--> statement-breakpoint
CREATE TYPE "brioela"."banking_currency" AS ENUM('usd', 'eur', 'aed', 'aud', 'cad', 'dkk', 'hkd', 'jpy', 'nzd', 'nok', 'gbp', 'sgd', 'sek', 'chf', 'usdc', 'usdt', 'eurc', 'dai', 'wbtc', 'eth');--> statement-breakpoint
CREATE TYPE "brioela"."banking_rail" AS ENUM('ach', 'wire', 'sepa', 'swift', 'uaefts');--> statement-breakpoint
CREATE TYPE "brioela"."banking_txn_reference_type" AS ENUM('pay_request', 'outgoing_payout', 'peer_to_peer', 'card_order', 'card_top_up', 'crypto_send', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "brioela"."banking_card_brand" AS ENUM('mastercard', 'visa');--> statement-breakpoint
CREATE TYPE "brioela"."banking_card_status" AS ENUM('active', 'frozen', 'cancelled', 'pending');--> statement-breakpoint
CREATE TYPE "brioela"."banking_card_type" AS ENUM('virtual', 'physical');--> statement-breakpoint
CREATE TYPE "brioela"."crypto_network" AS ENUM('ethereum', 'polygon', 'base', 'solana', 'tron', 'arbitrum');--> statement-breakpoint
CREATE TYPE "brioela"."deposit_method" AS ENUM('card', 'crypto', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "brioela"."holder_type" AS ENUM('individual', 'business', 'corporate');--> statement-breakpoint
CREATE TYPE "brioela"."payout_status" AS ENUM('created', 'in_flight', 'processing', 'completed', 'failed', 'canceled');--> statement-breakpoint
CREATE TYPE "brioela"."banking_peer_to_peer_transfer_status" AS ENUM('created', 'in_flight', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "brioela"."session_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "brioela"."banking_txn_direction" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "brioela"."banking_txn_status" AS ENUM('pending', 'completed', 'failed', 'declined');--> statement-breakpoint
CREATE TYPE "brioela"."banking_txn_type" AS ENUM('deposit', 'withdrawal', 'card_payment', 'transfer_in', 'transfer_out', 'fee');--> statement-breakpoint
CREATE TYPE "brioela"."banking_card_order_fee_type" AS ENUM('virtual_creation', 'physical_shipping');--> statement-breakpoint
CREATE TYPE "brioela"."banking_card_order_status" AS ENUM('created', 'processing', 'preparing', 'shipped', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "brioela"."banking_pay_request_status" AS ENUM('created', 'waiting_for_claim', 'claimed', 'expired', 'cancelled', 'in_flight', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "brioela"."banking_ledger_entry_type" AS ENUM('credit', 'debit', 'hold', 'release');--> statement-breakpoint
CREATE TYPE "brioela"."banking_ledger_hold_status" AS ENUM('active', 'released', 'captured', 'expired');--> statement-breakpoint
CREATE TYPE "brioela"."banking_offramp_outbox_status" AS ENUM('pending', 'in_progress', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "brioela"."banking_provider_transfer_mapping_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "brioela"."banking_limit_period" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "brioela"."banking_limit_scope" AS ENUM('card', 'transfer');--> statement-breakpoint
CREATE TYPE "brioela"."polling_job_status" AS ENUM('pending', 'in_progress', 'done', 'failed', 'expired');--> statement-breakpoint
CREATE TYPE "brioela"."in_app_notification_type" AS ENUM('payment', 'alert', 'transaction', 'security', 'system');--> statement-breakpoint
CREATE TABLE "brioela"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"banking_customer_id" text,
	"banking_kyc_status" "brioela"."banking_kyc_status" DEFAULT 'not_started' NOT NULL,
	"banking_kyc_updated_at" timestamp with time zone,
	"membership_number" text,
	"profile_picture" text,
	"brioela_tag" text,
	"is_discoverable" boolean DEFAULT false NOT NULL,
	"last_paid" timestamp with time zone,
	"phone" text,
	"subscription_end_date" timestamp with time zone,
	"payment_session_id" text,
	"payment_customer_id" text,
	"payment_customer_details" text,
	"payment_subscription_id" text,
	"payment_auth_provider" text,
	"payment_amount_total" text,
	"payment_invoice_id" text,
	"payment_metadata" jsonb,
	"payment_status" "brioela"."payment_status",
	"subscription_platform" "brioela"."subscription_platform",
	"subscription_product_id" text,
	"subscription_product_name" text,
	"subscription_product_price" integer,
	"subscription_product_currency" text,
	"account_access_status" "brioela"."account_access_status",
	"superwall_original_transaction_id" text,
	"superwall_original_app_user_id" text,
	"is_in_trial" boolean DEFAULT false,
	"trial_end_date" timestamp with time zone,
	"subscription_period_type" text,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"subscription_environment" text,
	"last_password_change" timestamp with time zone,
	"subscription_tier" "brioela"."subscription_tier",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_banking_customer_id_unique" UNIQUE("banking_customer_id"),
	CONSTRAINT "users_membership_number_unique" UNIQUE("membership_number"),
	CONSTRAINT "users_brioela_tag_unique" UNIQUE("brioela_tag"),
	CONSTRAINT "membership_number_format" CHECK (membership_number IS NULL OR membership_number ~ '^[IC]-[23456789ADEFGHJKLMNPQRTUVWXY]{8}$'),
	CONSTRAINT "brioela_tag_format" CHECK (brioela_tag IS NULL OR brioela_tag ~ '^[a-z][a-z0-9._]{1,18}[a-z0-9]$')
);
--> statement-breakpoint
ALTER TABLE "brioela"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."db_pingers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."db_pingers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "brioela"."session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "brioela"."verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."auth_signature_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_address" text NOT NULL,
	"purpose" text NOT NULL,
	"nonce" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_wallet_address_format" CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);
--> statement-breakpoint
ALTER TABLE "brioela"."auth_signature_challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."challenges" (
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
ALTER TABLE "brioela"."challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"platform" text,
	"model" text,
	"fingerprint" jsonb,
	"push_token" text,
	"trusted" boolean DEFAULT false NOT NULL,
	"bound_at" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."card_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"online_payments" boolean DEFAULT true NOT NULL,
	"magnetic_stripe" boolean DEFAULT true NOT NULL,
	"contactless" boolean DEFAULT true NOT NULL,
	"chip_transactions" boolean DEFAULT true NOT NULL,
	"mobile_wallet" boolean DEFAULT true NOT NULL,
	"cash_withdrawals" boolean DEFAULT true NOT NULL,
	"non_3d_secure" boolean DEFAULT true NOT NULL,
	"overseas_payments" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."card_controls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."push_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"provider" "brioela"."notification_provider",
	"token" text NOT NULL,
	"platform" text,
	"model" text,
	"active" boolean DEFAULT true NOT NULL,
	"registered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."push_notification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_virtual_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_beneficiary_name" text,
	"account_beneficiary_address" text,
	"bank_address" text,
	"banking_rails" "brioela"."banking_rail"[] DEFAULT '{}'::"brioela"."banking_rail"[],
	"provider_id" text NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"bank_name" text,
	"iban" text,
	"bic" text,
	"account_number" text,
	"routing_number" text,
	"sort_code" text,
	"status" "brioela"."banking_account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "virtual_iban_format" CHECK (iban IS NULL OR iban ~ '^[A-Z]{2}[0-9A-Z]{13,32}$'),
	CONSTRAINT "virtual_bic_format" CHECK (bic IS NULL OR bic ~ '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$'),
	CONSTRAINT "virtual_routing_format" CHECK (routing_number IS NULL OR routing_number ~ '^[0-9]{9}$'),
	CONSTRAINT "virtual_sort_code_format" CHECK (sort_code IS NULL OR sort_code ~ '^[0-9]{6}$')
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_virtual_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_external_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_holder_name" text NOT NULL,
	"account_holder_type" "brioela"."holder_type" NOT NULL,
	"bank_name" text,
	"country_code" text NOT NULL,
	"label" text NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"iban" text,
	"bic" text,
	"account_number" text,
	"routing_number" text,
	"account_type" "brioela"."bank_account_type",
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
ALTER TABLE "brioela"."banking_external_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_crypto_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"wallet_address" text NOT NULL,
	"chain_network" text,
	"token_symbol" "brioela"."banking_currency",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_crypto_contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"type" "brioela"."banking_card_type" NOT NULL,
	"status" "brioela"."banking_card_status" DEFAULT 'pending' NOT NULL,
	"brand" "brioela"."banking_card_brand" DEFAULT 'mastercard' NOT NULL,
	"last_4" text NOT NULL,
	"expiry_month" integer NOT NULL,
	"expiry_year" integer NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"wallet_address" text,
	"cardholder_first_name" text,
	"cardholder_last_name" text,
	"label" text,
	"theme" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_card_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid,
	"type" "brioela"."banking_card_type" NOT NULL,
	"status" "brioela"."banking_card_order_status" DEFAULT 'created' NOT NULL,
	"fee_type" "brioela"."banking_card_order_fee_type" NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"provider_transfer_id" text,
	"provider_tx_hash" text,
	"shipping_address" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_card_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "brioela"."banking_txn_type" NOT NULL,
	"direction" "brioela"."banking_txn_direction" NOT NULL,
	"status" "brioela"."banking_txn_status" NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"rail" "brioela"."banking_rail",
	"reference_type" "brioela"."banking_txn_reference_type",
	"reference_id" uuid,
	"description" text,
	"display_title" text,
	"display_subtitle" text,
	"merchant_logo_url" text,
	"merchant_initial" text,
	"category" text,
	"note" text,
	"transaction_number" text,
	"occurred_at" timestamp with time zone,
	"display_metadata_version" integer DEFAULT 1,
	"display_metadata" jsonb,
	"attachments" jsonb,
	"card_id" uuid,
	"virtual_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_pay_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"amount_atomic" bigint NOT NULL,
	"source_currency" "brioela"."banking_currency" NOT NULL,
	"payout_currency" "brioela"."banking_currency" NOT NULL,
	"transfer_purpose" text,
	"provider_transfer_id" text,
	"provider_tx_hash" text,
	"status" "brioela"."banking_pay_request_status" NOT NULL,
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
ALTER TABLE "brioela"."banking_pay_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_ledger_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"balance_available_atomic" bigint DEFAULT 0 NOT NULL,
	"balance_held_atomic" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_ledger_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"type" "brioela"."banking_ledger_entry_type" NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_ledger_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_ledger_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"status" "brioela"."banking_ledger_hold_status" NOT NULL,
	"reference_type" text,
	"reference_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"released_at" timestamp with time zone,
	"captured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_ledger_holds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"network" "brioela"."crypto_network" DEFAULT 'ethereum' NOT NULL,
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
ALTER TABLE "brioela"."banking_wallets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_wallet_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"session_key_address" text NOT NULL,
	"chain_id" integer,
	"approved_targets" jsonb,
	"native_token_limit_per_transaction" numeric(78, 0),
	"expires_at" timestamp with time zone NOT NULL,
	"status" "brioela"."session_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_wallet_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_kyc_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"provider" text NOT NULL,
	"provider_customer_id" text,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_kyc_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_outgoing_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"status" "brioela"."payout_status" DEFAULT 'created' NOT NULL,
	"destination_external_account_id" uuid,
	"encrypted_destination_bank_details" text,
	"transfer_purpose" text,
	"provider_transfer_id" text,
	"provider_tx_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destination_check" CHECK ("brioela"."banking_outgoing_payouts"."destination_external_account_id" IS NOT NULL OR "brioela"."banking_outgoing_payouts"."encrypted_destination_bank_details" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_outgoing_payouts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_peer_to_peer_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"transfer_purpose" text,
	"status" "brioela"."banking_peer_to_peer_transfer_status" DEFAULT 'created' NOT NULL,
	"provider_transfer_id" text,
	"provider_tx_hash" text,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_peer_to_peer_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_customer_kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text,
	"customer_type" "brioela"."holder_type",
	"status" "brioela"."banking_kyc_status" NOT NULL,
	"sub_status" text,
	"kyc_flow_link" text,
	"email" text,
	"first_name" text,
	"last_name" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_customer_kyc" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text,
	"street_line1" text,
	"city" text,
	"postal_code" text,
	"country" text,
	"state" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_customer_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_customer_kyc_rail_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text,
	"currency" "brioela"."banking_currency" NOT NULL,
	"rail" "brioela"."banking_rail" NOT NULL,
	"status" "brioela"."banking_kyc_status" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_customer_kyc_rail_approvals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_offramp_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_type" "brioela"."banking_txn_reference_type" NOT NULL,
	"reference_id" uuid NOT NULL,
	"payload" jsonb,
	"status" "brioela"."banking_offramp_outbox_status" DEFAULT 'pending' NOT NULL,
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
ALTER TABLE "brioela"."banking_offramp_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_provider_transfer_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"rail" "brioela"."banking_rail",
	"provider" text NOT NULL,
	"provider_transfer_id" text NOT NULL,
	"provider_tx_hash" text,
	"reference_type" "brioela"."banking_txn_reference_type" NOT NULL,
	"reference_id" uuid NOT NULL,
	"status" "brioela"."banking_provider_transfer_mapping_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_provider_transfer_mappings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."banking_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" "brioela"."banking_currency" NOT NULL,
	"scope" "brioela"."banking_limit_scope" NOT NULL,
	"period" "brioela"."banking_limit_period" NOT NULL,
	"amount_atomic" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brioela"."banking_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."communication_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"encrypted_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "communication_codes_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "brioela"."communication_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."polling_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"operation" text NOT NULL,
	"internal_id" text,
	"external_id" text,
	"context" jsonb,
	"payload" jsonb,
	"status" "brioela"."polling_job_status" DEFAULT 'pending' NOT NULL,
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
ALTER TABLE "brioela"."polling_jobs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brioela"."in_app_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" "brioela"."in_app_notification_type" NOT NULL,
	"link" text,
	"action_label" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "brioela"."in_app_notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "brioela"."session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."auth_signature_challenges" ADD CONSTRAINT "auth_signature_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."challenges" ADD CONSTRAINT "challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."challenges" ADD CONSTRAINT "challenges_consumed_by_user_id_users_id_fk" FOREIGN KEY ("consumed_by_user_id") REFERENCES "brioela"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."card_controls" ADD CONSTRAINT "card_controls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."push_notification" ADD CONSTRAINT "push_notification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_virtual_accounts" ADD CONSTRAINT "banking_virtual_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_external_accounts" ADD CONSTRAINT "banking_external_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_crypto_contacts" ADD CONSTRAINT "banking_crypto_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_cards" ADD CONSTRAINT "banking_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_card_orders" ADD CONSTRAINT "banking_card_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_transactions" ADD CONSTRAINT "banking_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_transactions" ADD CONSTRAINT "banking_transactions_card_id_banking_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "brioela"."banking_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_transactions" ADD CONSTRAINT "banking_transactions_virtual_account_id_banking_virtual_accounts_id_fk" FOREIGN KEY ("virtual_account_id") REFERENCES "brioela"."banking_virtual_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_pay_requests" ADD CONSTRAINT "banking_pay_requests_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_ledger_accounts" ADD CONSTRAINT "banking_ledger_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_ledger_entries" ADD CONSTRAINT "banking_ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_ledger_entries" ADD CONSTRAINT "banking_ledger_entries_account_id_banking_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "brioela"."banking_ledger_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_ledger_holds" ADD CONSTRAINT "banking_ledger_holds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_ledger_holds" ADD CONSTRAINT "banking_ledger_holds_account_id_banking_ledger_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "brioela"."banking_ledger_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_wallets" ADD CONSTRAINT "banking_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_wallet_sessions" ADD CONSTRAINT "banking_wallet_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_wallet_sessions" ADD CONSTRAINT "banking_wallet_sessions_wallet_id_banking_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "brioela"."banking_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_kyc_events" ADD CONSTRAINT "banking_kyc_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_outgoing_payouts" ADD CONSTRAINT "banking_outgoing_payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_outgoing_payouts" ADD CONSTRAINT "banking_outgoing_payouts_destination_external_account_id_banking_external_accounts_id_fk" FOREIGN KEY ("destination_external_account_id") REFERENCES "brioela"."banking_external_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_peer_to_peer_transfers" ADD CONSTRAINT "banking_peer_to_peer_transfers_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "brioela"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_peer_to_peer_transfers" ADD CONSTRAINT "banking_peer_to_peer_transfers_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "brioela"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_customer_kyc" ADD CONSTRAINT "banking_customer_kyc_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_customer_addresses" ADD CONSTRAINT "banking_customer_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_customer_kyc_rail_approvals" ADD CONSTRAINT "banking_customer_kyc_rail_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_provider_transfer_mappings" ADD CONSTRAINT "banking_provider_transfer_mappings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_limits" ADD CONSTRAINT "banking_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."communication_codes" ADD CONSTRAINT "communication_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banking_virtual_accounts_one_per_user_currency" ON "brioela"."banking_virtual_accounts" USING btree ("user_id","currency");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_external_accounts_user_label_unique" ON "brioela"."banking_external_accounts" USING btree ("user_id","label");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_ledger_accounts_user_currency_unique" ON "brioela"."banking_ledger_accounts" USING btree ("user_id","currency");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_wallet_sessions_one_active_per_wallet" ON "brioela"."banking_wallet_sessions" USING btree ("wallet_id") WHERE status = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "banking_customer_kyc_user_provider_unique" ON "brioela"."banking_customer_kyc" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_customer_addresses_user_provider_unique" ON "brioela"."banking_customer_addresses" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_customer_kyc_rail_approvals_user_currency_rail_unique" ON "brioela"."banking_customer_kyc_rail_approvals" USING btree ("user_id","currency","rail");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_offramp_outbox_dedupe_key_unique" ON "brioela"."banking_offramp_outbox" USING btree ("dedupe_key") WHERE "brioela"."banking_offramp_outbox"."dedupe_key" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "banking_provider_transfer_mappings_provider_transfer_unique" ON "brioela"."banking_provider_transfer_mappings" USING btree ("provider","provider_transfer_id") WHERE "brioela"."banking_provider_transfer_mappings"."provider_transfer_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "banking_limits_user_currency_scope_period_unique" ON "brioela"."banking_limits" USING btree ("user_id","currency","scope","period");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "brioela"."in_app_notifications" USING btree ("user_id");