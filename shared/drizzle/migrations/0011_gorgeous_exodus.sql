ALTER TABLE "schnl"."users" ADD COLUMN "handle" text;--> statement-breakpoint
ALTER TABLE "schnl"."users" ADD CONSTRAINT "users_handle_unique" UNIQUE("handle");--> statement-breakpoint
ALTER TABLE "schnl"."users" ADD CONSTRAINT "handle_format" CHECK (handle IS NULL OR handle ~ '^[a-z][a-z0-9._]{1,18}[a-z0-9]$');