import { text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { HolderType } from "./banking-enums.schema";
import { BankingKycStatus } from "./user.schema";

export const bankingCustomerKyc = schnlSchema
  .table(
    "banking_customer_kyc",
    {
      id: uuid("id").defaultRandom().primaryKey(),

      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),

      provider: text("provider").notNull(),
      providerCustomerId: text("provider_customer_id"),

      customerType: HolderType("customer_type"),

      status: BankingKycStatus("status").notNull(),
      subStatus: text("sub_status"),
      kycFlowLink: text("kyc_flow_link"),

      email: text("email"),
      firstName: text("first_name"),
      lastName: text("last_name"),

      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      uniqueIndex("banking_customer_kyc_user_provider_unique").on(
        table.userId,
        table.provider
      ),
    ]
  )
  .enableRLS();

export type BankingCustomerKyc = typeof bankingCustomerKyc.$inferSelect;
export type NewBankingCustomerKyc = typeof bankingCustomerKyc.$inferInsert;
