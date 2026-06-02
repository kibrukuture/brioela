ALTER TABLE "schnl"."account" ADD COLUMN "access_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schnl"."account" ADD COLUMN "refresh_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "schnl"."account" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "schnl"."account" DROP COLUMN "expires_at";