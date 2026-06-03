import { sql } from "@brioela/shared/drizzle";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import {
  bigint,
  jsonb,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import {
  BankingCurrency,
  BankingRail,
  BankingTransactionReferenceType,
} from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const providerTransferMappingStatusValues = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export const ProviderTransferMappingStatus = brioelaSchema.enum(
  "banking_provider_transfer_mapping_status",
  providerTransferMappingStatusValues
);

export const bankingProviderTransferMappings = brioelaSchema
  .table(
    "banking_provider_transfer_mappings",
    {
      id: uuid("id").defaultRandom().primaryKey(),

      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),

      amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),
      currency: BankingCurrency("currency").notNull(),
      rail: BankingRail("rail"),

      provider: text("provider").notNull(),
      providerTransferId: text("provider_transfer_id").notNull(),

      providerTxHash: text("provider_tx_hash"),

      referenceType:
        BankingTransactionReferenceType("reference_type").notNull(),
      referenceId: uuid("reference_id").notNull(),

      status: ProviderTransferMappingStatus("status")
        .default("pending")
        .notNull(),

      payload: jsonb("payload"),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      uniqueIndex("banking_provider_transfer_mappings_provider_transfer_unique")
        .on(table.provider, table.providerTransferId)
        .where(sql`${table.providerTransferId} IS NOT NULL`),
    ]
  )
  .enableRLS();

export type BankingProviderTransferMapping =
  typeof bankingProviderTransferMappings.$inferSelect;
export type NewBankingProviderTransferMapping =
  typeof bankingProviderTransferMappings.$inferInsert;
