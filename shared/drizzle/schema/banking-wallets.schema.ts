import { sql } from "@brioela/shared/drizzle";
import { text, timestamp, uuid, boolean, check } from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { CryptoNetwork } from "./banking-enums.schema";

export const bankingWallets = schnlSchema
  .table(
    "banking_wallets",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),
      address: text("address").notNull().unique(), // The public address
      network: CryptoNetwork("network").default("ethereum").notNull(), // Strict Enum
      isPrimary: boolean("is_primary").default(false).notNull(), // Default FALSE for safety

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      // Strict Network-Aware Address Validation
      check(
        "wallet_address_network_format",
        sql`
        (network = 'solana' AND address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$') OR
        (network != 'solana' AND address ~ '^0x[a-fA-F0-9]{40}$')
        `
      ),
    ]
  )
  .enableRLS();

export type BankingWallet = typeof bankingWallets.$inferSelect;
export type NewBankingWallet = typeof bankingWallets.$inferInsert;
