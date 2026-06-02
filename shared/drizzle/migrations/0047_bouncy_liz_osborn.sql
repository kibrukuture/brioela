CREATE TYPE "schnl"."banking_peer_to_peer_transfer_status" AS ENUM('created', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "schnl"."banking_peer_to_peer_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"amount_atomic" bigint NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"transfer_purpose" text,
	"status" "schnl"."banking_peer_to_peer_transfer_status" DEFAULT 'created' NOT NULL,
	"provider_transfer_id" text,
	"provider_tx_hash" text,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_peer_to_peer_transfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_peer_to_peer_transfers" ADD CONSTRAINT "banking_peer_to_peer_transfers_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_peer_to_peer_transfers" ADD CONSTRAINT "banking_peer_to_peer_transfers_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;