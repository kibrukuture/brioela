import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";

import { BankingCurrency } from "./banking-enums.schema";

export const bankingCryptoContacts = schnlSchema
  .table("banking_crypto_contacts", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    name: text("name").notNull(),
    walletAddress: text("wallet_address").notNull(),

    chainNetwork: text("chain_network"),
    tokenSymbol: BankingCurrency("token_symbol"), // Strict mapping to currency symbols

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingCryptoContact = typeof bankingCryptoContacts.$inferSelect;
export type NewBankingCryptoContact = typeof bankingCryptoContacts.$inferInsert;
