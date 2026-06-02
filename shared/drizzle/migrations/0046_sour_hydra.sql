ALTER TABLE "schnl"."banking_pay_requests" ADD COLUMN "transfer_purpose" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_outgoing_payouts" ADD COLUMN "transfer_purpose" text;