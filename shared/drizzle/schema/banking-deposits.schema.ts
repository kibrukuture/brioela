import { bigint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import { users } from "@schnl/shared/drizzle/schema/user.schema";
import {
  BankingCurrency,
  DepositMethod,
  TransactionStatus,
} from "./banking-enums.schema";

export const bankingDeposits = schnlSchema
  .table("banking_deposits", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),
    currency: BankingCurrency("currency").notNull(),
    method: DepositMethod("method").notNull(),
    status: TransactionStatus("status").default("pending").notNull(),
    provider: text("provider"),
    providerReferenceId: text("provider_reference_id"),
    providerPayloadEncrypted: text("provider_payload_encrypted"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingDeposit = typeof bankingDeposits.$inferSelect;
export type NewBankingDeposit = typeof bankingDeposits.$inferInsert;
