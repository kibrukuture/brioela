ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "attachments" jsonb;