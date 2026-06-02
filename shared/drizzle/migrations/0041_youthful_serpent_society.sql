CREATE TABLE "schnl"."banking_customer_kyc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text,
	"customer_type" "schnl"."holder_type",
	"status" "schnl"."banking_kyc_status" NOT NULL,
	"sub_status" text,
	"kyc_flow_link" text,
	"email" text,
	"first_name" text,
	"last_name" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_customer_kyc" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text,
	"street_line1" text,
	"city" text,
	"postal_code" text,
	"country" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_customer_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "schnl"."banking_customer_kyc_rail_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_customer_id" text,
	"currency" "schnl"."banking_currency" NOT NULL,
	"rail" "schnl"."banking_rail" NOT NULL,
	"status" "schnl"."banking_kyc_status" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_customer_kyc_rail_approvals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_customer_kyc" ADD CONSTRAINT "banking_customer_kyc_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_customer_addresses" ADD CONSTRAINT "banking_customer_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schnl"."banking_customer_kyc_rail_approvals" ADD CONSTRAINT "banking_customer_kyc_rail_approvals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banking_customer_kyc_user_provider_unique" ON "schnl"."banking_customer_kyc" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_customer_addresses_user_provider_unique" ON "schnl"."banking_customer_addresses" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "banking_customer_kyc_rail_approvals_user_currency_rail_unique" ON "schnl"."banking_customer_kyc_rail_approvals" USING btree ("user_id","currency","rail");