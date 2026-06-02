CREATE TABLE "schnl"."devices" (
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
ALTER TABLE "schnl"."devices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."card_controls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" text NOT NULL,
	"online_payments" boolean DEFAULT true NOT NULL,
	"magnetic_stripe" boolean DEFAULT true NOT NULL,
	"contactless" boolean DEFAULT true NOT NULL,
	"chip_transactions" boolean DEFAULT true NOT NULL,
	"mobile_wallet" boolean DEFAULT true NOT NULL,
	"cash_withdrawals" boolean DEFAULT true NOT NULL,
	"non_3d_secure" boolean DEFAULT true NOT NULL,
	"overseas_payments" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."card_controls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "schnl"."user_devices" CASCADE;--> statement-breakpoint
DROP TABLE "schnl"."user_card_controls" CASCADE;--> statement-breakpoint
ALTER TABLE "schnl"."devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."card_controls" ADD CONSTRAINT "card_controls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;