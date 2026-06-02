import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import { users } from "@schnl/shared/drizzle/schema/user.schema";
import { bankingLedgerAccounts } from "@schnl/shared/drizzle/schema/banking-ledger-accounts.schema";
import { BankingCurrency } from "@schnl/shared/drizzle/schema/banking-enums.schema";
import { bigint, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const LedgerHoldStatus = schnlSchema.enum("banking_ledger_hold_status", [
  "active",
  "released",
  "captured",
  "expired",
]);

export const bankingLedgerHolds = schnlSchema
  .table("banking_ledger_holds", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    accountId: uuid("account_id")
      .notNull()
      .references(() => bankingLedgerAccounts.id, { onDelete: "cascade" }),

    currency: BankingCurrency("currency").notNull(),

    amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),

    status: LedgerHoldStatus("status").notNull(),

    referenceType: text("reference_type"),
    referenceId: uuid("reference_id"),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    capturedAt: timestamp("captured_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingLedgerHold = typeof bankingLedgerHolds.$inferSelect;
export type NewBankingLedgerHold = typeof bankingLedgerHolds.$inferInsert;
