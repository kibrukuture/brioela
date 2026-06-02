import { uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import { users } from "@schnl/shared/drizzle/schema/user.schema";

export const bankingKycEvents = schnlSchema
  .table("banking_kyc_events", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    provider: text("provider").notNull(),
    providerCustomerId: text("provider_customer_id"),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingKycEvent = typeof bankingKycEvents.$inferSelect;
export type NewBankingKycEvent = typeof bankingKycEvents.$inferInsert;
