import { sql } from "@schnl/shared/drizzle";
import { text, timestamp, uuid, check, uniqueIndex } from "drizzle-orm/pg-core";
import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import { users } from "@schnl/shared/drizzle/schema/user.schema";
import { BankingCurrency, AccountStatus } from "./banking-enums.schema";
import { BankingRail } from "./banking-enums.schema";

export const bankingVirtualAccounts = schnlSchema
  .table(
    "banking_virtual_accounts",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),
      accountBeneficiaryName: text("account_beneficiary_name"),
      accountBeneficiaryAddress: text("account_beneficiary_address"),
      bankAddress: text("bank_address"),
      bankingRails: BankingRail("banking_rails")
        .array()
        .default(sql`'{}'::"schnl"."banking_rail"[]`),

      providerId: text("provider_id").notNull(),
      currency: BankingCurrency("currency").notNull(),
      bankName: text("bank_name"),

      iban: text("iban"),
      bic: text("bic"),
      accountNumber: text("account_number"),
      routingNumber: text("routing_number"),
      sortCode: text("sort_code"),

      status: AccountStatus("status").default("active").notNull(),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      uniqueIndex("banking_virtual_accounts_one_per_user_currency").on(
        table.userId,
        table.currency
      ),
      // Global Banking Standards
      check(
        "virtual_iban_format",
        sql`iban IS NULL OR iban ~ '^[A-Z]{2}[0-9A-Z]{13,32}$'`
      ),
      check(
        "virtual_bic_format",
        sql`bic IS NULL OR bic ~ '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$'`
      ),
      check(
        "virtual_routing_format",
        sql`routing_number IS NULL OR routing_number ~ '^[0-9]{9}$'`
      ),
      check(
        "virtual_sort_code_format",
        sql`sort_code IS NULL OR sort_code ~ '^[0-9]{6}$'`
      ),
    ]
  )
  .enableRLS();

export type BankingVirtualAccount = typeof bankingVirtualAccounts.$inferSelect;
export type NewBankingVirtualAccount =
  typeof bankingVirtualAccounts.$inferInsert;
