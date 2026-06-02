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
ALTER TABLE "schnl"."banking_virtual_accounts" ADD CONSTRAINT "banking_virtual_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."banking_external_accounts" ADD CONSTRAINT "banking_external_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."banking_crypto_contacts" ADD CONSTRAINT "banking_crypto_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."banking_cards" ADD CONSTRAINT "banking_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD CONSTRAINT "banking_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallets" ADD CONSTRAINT "banking_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;