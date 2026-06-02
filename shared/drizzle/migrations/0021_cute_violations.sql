ALTER TABLE "schnl"."banking_virtual_accounts" ADD COLUMN "account_beneficiary_name" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_virtual_accounts" ADD COLUMN "account_beneficiary_address" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_virtual_accounts" ADD COLUMN "bank_address" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_virtual_accounts" ADD COLUMN "banking_rail" "schnl"."banking_rail";