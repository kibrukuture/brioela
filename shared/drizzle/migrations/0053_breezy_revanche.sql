ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "display_title" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "display_subtitle" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "merchant_logo_url" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "merchant_initial" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "transaction_number" text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "occurred_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "display_metadata_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ADD COLUMN "display_metadata" jsonb;