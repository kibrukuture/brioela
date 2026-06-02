CREATE TABLE "schnl"."user_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" text NOT NULL,
	"platform" text,
	"model" text,
	"fingerprint" jsonb,
	"push_token" text,
	"trusted" boolean DEFAULT false NOT NULL,
	"bound_at" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."user_devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;