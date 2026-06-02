ALTER TABLE "schnl"."banking_virtual_accounts" ALTER COLUMN "banking_rail" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ALTER COLUMN "rail" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "schnl"."banking_rail";--> statement-breakpoint
CREATE TYPE "schnl"."banking_rail" AS ENUM('ach', 'wire', 'sepa', 'swift', 'uaefts');--> statement-breakpoint
ALTER TABLE "schnl"."banking_virtual_accounts" ALTER COLUMN "banking_rail" SET DATA TYPE "schnl"."banking_rail" USING "banking_rail"::"schnl"."banking_rail";--> statement-breakpoint
ALTER TABLE "schnl"."banking_transactions" ALTER COLUMN "rail" SET DATA TYPE "schnl"."banking_rail" USING "rail"::"schnl"."banking_rail";