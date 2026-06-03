import { boolean, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { users } from "@brioela/shared/drizzle/schema/user.schema";

export const cardControls = brioelaSchema
  .table("card_controls", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: text("card_id").notNull(),
    onlinePayments: boolean("online_payments").notNull().default(true),
    magneticStripe: boolean("magnetic_stripe").notNull().default(true),
    contactless: boolean("contactless").notNull().default(true),
    chipTransactions: boolean("chip_transactions").notNull().default(true),
    mobileWallet: boolean("mobile_wallet").notNull().default(true),
    cashWithdrawals: boolean("cash_withdrawals").notNull().default(true),
    non3dSecure: boolean("non_3d_secure").notNull().default(true),
    overseasPayments: boolean("overseas_payments").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type CardControls = typeof cardControls.$inferSelect;
export type NewCardControls = typeof cardControls.$inferInsert;
