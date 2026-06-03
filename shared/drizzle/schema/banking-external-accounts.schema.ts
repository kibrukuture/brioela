import { sql } from "@brioela/shared/drizzle";
import { text, timestamp, uuid, check, uniqueIndex } from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import {
  BankAccountType,
  HolderType,
  BankingCurrency,
} from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const bankingExternalAccounts = brioelaSchema
  .table(
    "banking_external_accounts",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),
      accountHolderName: text("account_holder_name").notNull(),
      accountHolderType: HolderType("account_holder_type").notNull(),

      bankName: text("bank_name"),
      countryCode: text("country_code").notNull(),
      label: text("label").notNull(),
      currency: BankingCurrency("currency").notNull(),

      iban: text("iban"),
      bic: text("bic"),
      accountNumber: text("account_number"),
      routingNumber: text("routing_number"),
      accountType: BankAccountType("account_type"),
      sortCode: text("sort_code"),

      // Strict Address Requirements
      streetLine1: text("street_line1"),
      city: text("city"),
      state: text("state"),
      postalCode: text("postal_code"),
      country: text("country"),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      uniqueIndex("banking_external_accounts_user_label_unique").on(
        table.userId,
        table.label
      ),
      // Global Banking Standards
      check(
        "external_iban_format",
        sql`iban IS NULL OR iban ~ '^[A-Z]{2}[0-9A-Z]{13,32}$'`
      ),
      check(
        "external_bic_format",
        sql`bic IS NULL OR bic ~ '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$'`
      ),
      check(
        "external_routing_format",
        sql`routing_number IS NULL OR routing_number ~ '^[0-9]{9}$'`
      ),
      check(
        "external_sort_code_format",
        sql`sort_code IS NULL OR sort_code ~ '^[0-9]{6}$'`
      ),
    ]
  )
  .enableRLS();

export type BankingExternalAccount =
  typeof bankingExternalAccounts.$inferSelect;
export type NewBankingExternalAccount =
  typeof bankingExternalAccounts.$inferInsert;
