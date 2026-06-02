import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import { users } from "@schnl/shared/drizzle/schema/user.schema";
import { bankingLedgerAccounts } from "@schnl/shared/drizzle/schema/banking-ledger-accounts.schema";
import { BankingCurrency } from "@schnl/shared/drizzle/schema/banking-enums.schema";
import { bigint, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const LedgerEntryType = schnlSchema.enum("banking_ledger_entry_type", [
  "credit",
  "debit",
  "hold",
  "release",
]);

export const bankingLedgerEntries = schnlSchema
  .table("banking_ledger_entries", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    accountId: uuid("account_id")
      .notNull()
      .references(() => bankingLedgerAccounts.id, { onDelete: "cascade" }),

    currency: BankingCurrency("currency").notNull(),

    type: LedgerEntryType("type").notNull(),

    amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),

    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),

    description: text("description"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingLedgerEntry = typeof bankingLedgerEntries.$inferSelect;
export type NewBankingLedgerEntry = typeof bankingLedgerEntries.$inferInsert;
