ALTER TABLE "schnl"."users" ADD COLUMN "banking_customer_id" text;--> statement-breakpoint
ALTER TABLE "schnl"."users" ADD CONSTRAINT "users_banking_customer_id_unique" UNIQUE("banking_customer_id");