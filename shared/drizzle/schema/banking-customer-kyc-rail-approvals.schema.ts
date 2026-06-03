import { text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { BankingCurrency, BankingRail } from "./banking-enums.schema";
import { BankingKycStatus } from "./user.schema";

export const bankingCustomerKycRailApprovals = schnlSchema
  .table(
    "banking_customer_kyc_rail_approvals",
    {
      id: uuid("id").defaultRandom().primaryKey(),

      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),

      provider: text("provider").notNull(),
      providerCustomerId: text("provider_customer_id"),

      currency: BankingCurrency("currency").notNull(),
      rail: BankingRail("rail").notNull(),

      status: BankingKycStatus("status").notNull(),

      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      uniqueIndex(
        "banking_customer_kyc_rail_approvals_user_currency_rail_unique"
      ).on(table.userId, table.currency, table.rail),
    ]
  )
  .enableRLS();

export type BankingCustomerKycRailApproval =
  typeof bankingCustomerKycRailApprovals.$inferSelect;
export type NewBankingCustomerKycRailApproval =
  typeof bankingCustomerKycRailApprovals.$inferInsert;
