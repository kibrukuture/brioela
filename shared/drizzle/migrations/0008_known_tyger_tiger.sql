CREATE TYPE "schnl"."notification_provider" AS ENUM('expo', 'apns', 'fcm');--> statement-breakpoint
CREATE TABLE "schnl"."push_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"provider" "schnl"."notification_provider",
	"token" text NOT NULL,
	"platform" text,
	"model" text,
	"active" boolean DEFAULT true NOT NULL,
	"registered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."push_notification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."push_notification" ADD CONSTRAINT "push_notification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;