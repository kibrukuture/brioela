ALTER TABLE "schnl"."auth_signature_challenges" DROP CONSTRAINT "auth_signature_challenges_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "schnl"."auth_signature_challenges" ADD CONSTRAINT "auth_signature_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "schnl"."users"("id") ON DELETE cascade ON UPDATE cascade;