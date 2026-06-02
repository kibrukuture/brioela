ALTER TABLE "schnl"."users" DROP CONSTRAINT "users_handle_unique";--> statement-breakpoint
ALTER TABLE "schnl"."users" DROP CONSTRAINT "handle_format";--> statement-breakpoint
ALTER TABLE "schnl"."users" ADD COLUMN "schnl_tag" text;--> statement-breakpoint
ALTER TABLE "schnl"."users" DROP COLUMN "handle";--> statement-breakpoint
ALTER TABLE "schnl"."users" ADD CONSTRAINT "users_schnl_tag_unique" UNIQUE("schnl_tag");--> statement-breakpoint
ALTER TABLE "schnl"."users" ADD CONSTRAINT "schnl_tag_format" CHECK (schnl_tag IS NULL OR schnl_tag ~ '^[a-z][a-z0-9._]{1,18}[a-z0-9]$');