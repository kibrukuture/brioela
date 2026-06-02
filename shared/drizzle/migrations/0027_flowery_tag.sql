ALTER TABLE "schnl"."banking_wallet_sessions" ADD COLUMN "chain_id" integer;--> statement-breakpoint
ALTER TABLE "schnl"."banking_wallet_sessions" DROP COLUMN "encrypted_session_key";