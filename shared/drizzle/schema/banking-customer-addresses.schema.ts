import { text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";

export const bankingCustomerAddresses = schnlSchema
  .table(
    "banking_customer_addresses",
    {
      id: uuid("id").defaultRandom().primaryKey(),

      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),

      provider: text("provider").notNull(),
      providerCustomerId: text("provider_customer_id"),

      streetLine1: text("street_line1"),
      city: text("city"),
      postalCode: text("postal_code"),
      country: text("country"),
      state: text("state"),

      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      uniqueIndex("banking_customer_addresses_user_provider_unique").on(
        table.userId,
        table.provider
      ),
    ]
  )
  .enableRLS();

export type BankingCustomerAddress =
  typeof bankingCustomerAddresses.$inferSelect;
export type NewBankingCustomerAddress =
  typeof bankingCustomerAddresses.$inferInsert;
