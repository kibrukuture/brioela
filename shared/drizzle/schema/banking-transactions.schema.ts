import {
  text,
  timestamp,
  uuid,
  bigint,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { bankingCards } from "./banking-cards.schema";
import { bankingVirtualAccounts } from "./banking-virtual-accounts.schema";
import type { BankingTransactionDisplayMetadata } from "@brioela/shared/validators/banking-transaction.validator";
import type { BankingTransactionAttachment } from "@brioela/shared/validators/banking-transaction-attachment.validator";
import {
  TransactionType,
  TransactionDirection,
  TransactionStatus,
  BankingRail,
  BankingCurrency,
  BankingTransactionReferenceType,
} from "./banking-enums.schema";

export const bankingTransactions = schnlSchema
  .table("banking_transactions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    type: TransactionType("type").notNull(),
    direction: TransactionDirection("direction").notNull(),
    status: TransactionStatus("status").notNull(),

    amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),
    currency: BankingCurrency("currency").notNull(),

    rail: BankingRail("rail"),

    referenceType: BankingTransactionReferenceType("reference_type"),
    referenceId: uuid("reference_id"),
    description: text("description"),

    displayTitle: text("display_title"),
    displaySubtitle: text("display_subtitle"),
    merchantLogoUrl: text("merchant_logo_url"),
    merchantInitial: text("merchant_initial"),
    category: text("category"),
    note: text("note"),
    transactionNumber: text("transaction_number"),

    occurredAt: timestamp("occurred_at", { withTimezone: true }),

    displayMetadataVersion: integer("display_metadata_version").default(1),
    displayMetadata: jsonb(
      "display_metadata"
    ).$type<BankingTransactionDisplayMetadata | null>(),

    attachments: jsonb("attachments").$type<
      BankingTransactionAttachment[] | null
    >(),

    cardId: uuid("card_id").references(() => bankingCards.id),
    virtualAccountId: uuid("virtual_account_id").references(
      () => bankingVirtualAccounts.id
    ),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    settledAt: timestamp("settled_at", { withTimezone: true }),
  })
  .enableRLS();

export type BankingTransaction = typeof bankingTransactions.$inferSelect;
export type NewBankingTransaction = typeof bankingTransactions.$inferInsert;
