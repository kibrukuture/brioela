CREATE TYPE "schnl"."deposit_method" AS ENUM('card', 'crypto', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "schnl"."payout_status" AS ENUM('created', 'processing', 'completed', 'failed', 'canceled');--> statement-breakpoint
ALTER TABLE "schnl"."banking_external_accounts" ADD COLUMN "label" text NOT NULL;