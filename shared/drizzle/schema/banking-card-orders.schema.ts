import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import {
  CardType,
  BankingCurrency,
} from "@brioela/shared/drizzle/schema/banking-enums.schema";
import { bigint, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const BankingCardOrderStatus = brioelaSchema.enum(
  "banking_card_order_status",
  ["created", "processing", "preparing", "shipped", "completed", "failed"]
);

export const BankingCardOrderFeeType = brioelaSchema.enum(
  "banking_card_order_fee_type",
  ["virtual_creation", "physical_shipping"]
);

export type BankingCardOrderShippingAddress = {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
} | null;

export const bankingCardOrders = brioelaSchema
  .table("banking_card_orders", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    cardId: uuid("card_id"),

    type: CardType("type").notNull(),
    status: BankingCardOrderStatus("status").default("created").notNull(),
    feeType: BankingCardOrderFeeType("fee_type").notNull(),

    amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),
    currency: BankingCurrency("currency").notNull(),

    providerTransferId: text("provider_transfer_id"),
    providerTxHash: text("provider_tx_hash"),

    shippingAddress:
      jsonb("shipping_address").$type<BankingCardOrderShippingAddress>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingCardOrder = typeof bankingCardOrders.$inferSelect;
export type NewBankingCardOrder = typeof bankingCardOrders.$inferInsert;
