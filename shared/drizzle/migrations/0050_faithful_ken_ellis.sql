ALTER TABLE "schnl"."banking_peer_to_peer_transfers" DROP CONSTRAINT "banking_peer_to_peer_transfers_sender_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_peer_to_peer_transfers" DROP CONSTRAINT "banking_peer_to_peer_transfers_recipient_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_pay_requests" ADD COLUMN "provider_tx_hash" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_outgoing_payouts" ADD COLUMN "provider_tx_hash" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_peer_to_peer_transfers" ADD CONSTRAINT "banking_peer_to_peer_transfers_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "schnl"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_peer_to_peer_transfers" ADD CONSTRAINT "banking_peer_to_peer_transfers_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "schnl"."users"("id") ON DELETE restrict ON UPDATE no action;