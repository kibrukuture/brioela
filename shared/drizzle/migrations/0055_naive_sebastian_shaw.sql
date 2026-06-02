CREATE TYPE "schnl"."banking_card_order_fee_type" AS ENUM('virtual_creation', 'physical_shipping');--> statement-breakpoint
CREATE TYPE "schnl"."banking_card_order_status" AS ENUM('created', 'processing', 'preparing', 'shipped', 'completed', 'failed');--> statement-breakpoint
ALTER TYPE "schnl"."banking_txn_reference_type" ADD VALUE 'card_order' BEFORE 'card_top_up';--> statement-breakpoint
CREATE TABLE "schnl"."banking_card_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid,
	"type" "schnl"."banking_card_type" NOT NULL,
	"status" "schnl"."banking_card_order_status" DEFAULT 'created' NOT NULL,
	"fee_type" "schnl"."banking_card_order_fee_type" NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"provider_transfer_id" text,
	"provider_tx_hash" text,
	"shipping_address" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_card_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_card_orders" ADD CONSTRAINT "banking_card_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;