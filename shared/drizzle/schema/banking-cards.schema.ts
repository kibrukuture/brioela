import { text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import {
  CardType,
  CardStatus,
  CardBrand,
  BankingCurrency,
} from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const bankingCards = brioelaSchema
  .table("banking_cards", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    providerId: text("provider_id").notNull(),

    type: CardType("type").notNull(),
    status: CardStatus("status").default("pending").notNull(),
    brand: CardBrand("brand").default("mastercard").notNull(),

    last4: text("last_4").notNull(),
    expiryMonth: integer("expiry_month").notNull(),
    expiryYear: integer("expiry_year").notNull(),

    currency: BankingCurrency("currency").notNull(),
    walletAddress: text("wallet_address"),

    cardholderFirstName: text("cardholder_first_name"),
    cardholderLastName: text("cardholder_last_name"),

    label: text("label"),
    theme: text("theme"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingCard = typeof bankingCards.$inferSelect;
export type NewBankingCard = typeof bankingCards.$inferInsert;
