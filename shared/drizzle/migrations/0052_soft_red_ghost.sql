CREATE TYPE "schnl"."in_app_notification_type" AS ENUM('payment', 'alert', 'transaction', 'security', 'system');--> statement-breakpoint
CREATE TABLE "schnl"."in_app_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" "schnl"."in_app_notification_type" NOT NULL,
	"link" text,
	"action_label" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "schnl"."in_app_notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "schnl"."in_app_notifications" USING btree ("user_id");