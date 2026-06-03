import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { text, timestamp, uuid, check } from "drizzle-orm/pg-core";
import { sql } from "@brioela/shared/drizzle";

export const authSignatureChallenges = schnlSchema
  .table(
    "auth_signature_challenges",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),
      walletAddress: text("wallet_address").notNull(),
      purpose: text("purpose").notNull(),
      nonce: text("nonce").notNull(),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
      usedAt: timestamp("used_at", { withTimezone: true }),
      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      check(
        "challenge_wallet_address_format",
        sql`wallet_address ~ '^0x[a-fA-F0-9]{40}$'`
      ),
    ]
  )
  .enableRLS();

export type AuthSignatureChallenge =
  typeof authSignatureChallenges.$inferSelect;
export type NewAuthSignatureChallenge =
  typeof authSignatureChallenges.$inferInsert;
