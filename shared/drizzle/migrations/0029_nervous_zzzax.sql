ALTER TABLE "schnl"."banking_wallet_sessions" DROP CONSTRAINT "banking_wallet_sessions_wallet_id_banking_wallets_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" ADD CONSTRAINT "banking_wallet_sessions_wallet_id_banking_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "schnl"."banking_wallets"("id") ON DELETE cascade ON UPDATE cascade;