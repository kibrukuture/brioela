CREATE TYPE "schnl"."banking_limit_period" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "schnl"."banking_limit_scope" AS ENUM('card', 'transfer');--> statement-breakpoint
CREATE TABLE "schnl"."banking_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" "schnl"."banking_currency" NOT NULL,
	"scope" "schnl"."banking_limit_scope" NOT NULL,
	"period" "schnl"."banking_limit_period" NOT NULL,
	"amount_atomic" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schnl"."banking_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."banking_limits" ADD CONSTRAINT "banking_limits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "banking_limits_user_currency_scope_period_unique" ON "schnl"."banking_limits" USING btree ("user_id","currency","scope","period");