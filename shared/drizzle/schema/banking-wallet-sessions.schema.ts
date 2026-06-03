import {
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  numeric,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { sql } from "@brioela/shared/drizzle";
import { users } from "./user.schema";
import { bankingWallets } from "./banking-wallets.schema";
import { SessionStatus } from "./banking-enums.schema";

export const bankingWalletSessions = schnlSchema
  .table(
    "banking_wallet_sessions",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      userId: uuid("user_id")
        .references(() => users.id)
        .notNull(),
      walletId: uuid("wallet_id")
        .notNull()
        .references(() => bankingWallets.id, {
          onDelete: "cascade",
        }),
      sessionKeyAddress: text("session_key_address").notNull(),
      chainId: integer("chain_id"),

      // Permissions (Thirdweb Session Key Policies)
      approvedTargets: jsonb("approved_targets").$type<string[]>(),
      nativeTokenLimitPerTransaction: numeric(
        "native_token_limit_per_transaction",
        {
          precision: 78,
          scale: 0,
        }
      ),
      expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

      status: SessionStatus("status").default("active").notNull(),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      uniqueIndex("banking_wallet_sessions_one_active_per_wallet")
        .on(table.walletId)
        .where(sql`status = 'active'`),
    ]
  )
  .enableRLS();

export type BankingWalletSession = typeof bankingWalletSessions.$inferSelect;
export type NewBankingWalletSession = typeof bankingWalletSessions.$inferInsert;
