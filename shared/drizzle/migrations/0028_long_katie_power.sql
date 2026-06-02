CREATE TABLE "schnl"."auth_signature_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_address" text NOT NULL,
	"purpose" text NOT NULL,
	"nonce" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "challenge_wallet_address_format" CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$')
);
--> statement-breakpoint
ALTER TABLE "schnl"."auth_signature_challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "schnl"."auth_signature_challenges" ADD CONSTRAINT "auth_signature_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE no action ON UPDATE no action;