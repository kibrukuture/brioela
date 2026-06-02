ALTER TABLE "schnl"."auth_signature_challenges" DROP CONSTRAINT "auth_signature_challenges_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_virtual_accounts" DROP CONSTRAINT "banking_virtual_accounts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_external_accounts" DROP CONSTRAINT "banking_external_accounts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_crypto_contacts" DROP CONSTRAINT "banking_crypto_contacts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_cards" DROP CONSTRAINT "banking_cards_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" DROP CONSTRAINT "banking_transactions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallets" DROP CONSTRAINT "banking_wallets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" DROP CONSTRAINT "banking_wallet_sessions_wallet_id_banking_wallets_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" ADD COLUMN "approved_targets" jsonb;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" ADD COLUMN "native_token_limit_per_transaction" integer;--> statement-breakpoint
ALTER TABLE "schnl"."auth_signature_challenges" ADD CONSTRAINT "auth_signature_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_virtual_accounts" ADD CONSTRAINT "banking_virtual_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_external_accounts" ADD CONSTRAINT "banking_external_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_crypto_contacts" ADD CONSTRAINT "banking_crypto_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_cards" ADD CONSTRAINT "banking_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD CONSTRAINT "banking_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallets" ADD CONSTRAINT "banking_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" ADD CONSTRAINT "banking_wallet_sessions_wallet_id_banking_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "schnl"."banking_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" DROP COLUMN "allowed_contracts";--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" DROP COLUMN "max_native_token_per_tx";