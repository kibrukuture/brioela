ALTER TABLE "brioela"."banking_wallet_sessions" DROP CONSTRAINT "banking_wallet_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "brioela"."banking_peer_to_peer_transfers" DROP CONSTRAINT "banking_peer_to_peer_transfers_sender_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "brioela"."banking_peer_to_peer_transfers" DROP CONSTRAINT "banking_peer_to_peer_transfers_recipient_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "brioela"."banking_wallet_sessions" ADD CONSTRAINT "banking_wallet_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_peer_to_peer_transfers" ADD CONSTRAINT "banking_peer_to_peer_transfers_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brioela"."banking_peer_to_peer_transfers" ADD CONSTRAINT "banking_peer_to_peer_transfers_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "brioela"."users"("id") ON DELETE cascade ON UPDATE no action;