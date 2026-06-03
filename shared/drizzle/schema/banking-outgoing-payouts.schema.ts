import { sql } from "@brioela/shared/drizzle";
import { bigint, text, timestamp, uuid, check } from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { bankingExternalAccounts } from "@brioela/shared/drizzle/schema/banking-external-accounts.schema";
import { BankingCurrency, PayoutStatus } from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const bankingOutgoingPayouts = brioelaSchema
  .table(
    "banking_outgoing_payouts",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),
      amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),
      currency: BankingCurrency("currency").notNull(),
      status: PayoutStatus("status").default("created").notNull(),
      destinationExternalAccountId: uuid(
        "destination_external_account_id"
      ).references(() => bankingExternalAccounts.id, {
        onDelete: "set null",
      }),
      encryptedDestinationBankDetails: text(
        "encrypted_destination_bank_details"
      ),

      transferPurpose: text("transfer_purpose"),
      providerTransferId: text("provider_transfer_id"),
      providerTxHash: text("provider_tx_hash"),
      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      check(
        "destination_check",
        sql`${table.destinationExternalAccountId} IS NOT NULL OR ${table.encryptedDestinationBankDetails} IS NOT NULL`
      ),
    ]
  )
  .enableRLS();

export type BankingOutgoingPayout = typeof bankingOutgoingPayouts.$inferSelect;
export type NewBankingOutgoingPayout =
  typeof bankingOutgoingPayouts.$inferInsert;
