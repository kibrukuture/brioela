import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";
import { sql } from "@brioela/shared/drizzle";
import { bigint, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

// “Balance sheet snapshot” ( the main one. )
// This table is basically the current balances per user per currency.
// one row per (userId, currency)
export const bankingLedgerAccounts = schnlSchema
  .table(
    "banking_ledger_accounts",
    {
      id: uuid("id").defaultRandom().primaryKey(),

      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),

      currency: BankingCurrency("currency").notNull(),

      balanceAvailableAtomic: bigint("balance_available_atomic", {
        mode: "bigint",
      })
        .default(sql`0`)
        .notNull(),

      balanceHeldAtomic: bigint("balance_held_atomic", {
        mode: "bigint",
      })
        .default(sql`0`)
        .notNull(),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (t) => [
      uniqueIndex("banking_ledger_accounts_user_currency_unique").on(
        t.userId,
        t.currency
      ),
    ]
  )
  .enableRLS();

export type BankingLedgerAccount = typeof bankingLedgerAccounts.$inferSelect;
export type NewBankingLedgerAccount = typeof bankingLedgerAccounts.$inferInsert;
