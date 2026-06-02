ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "provider_transfer_id" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_pay_requests" ADD COLUMN "provider_transfer_id" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_customer_addresses" ADD COLUMN "state" text;