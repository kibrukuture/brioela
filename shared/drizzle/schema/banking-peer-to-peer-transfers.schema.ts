import { bigint, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import {
  BankingCurrency,
  PeerToPeerTransferStatus,
} from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const bankingPeerToPeerTransfers = brioelaSchema
  .table("banking_peer_to_peer_transfers", {
    id: uuid("id").defaultRandom().primaryKey(),

    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),

    currency: BankingCurrency("currency").notNull(),

    transferPurpose: text("transfer_purpose"),

    status: PeerToPeerTransferStatus("status").default("created").notNull(),

    providerTransferId: text("provider_transfer_id"),
    providerTxHash: text("provider_tx_hash"),

    completedAt: timestamp("completed_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingPeerToPeerTransfer =
  typeof bankingPeerToPeerTransfers.$inferSelect;
export type NewBankingPeerToPeerTransfer =
  typeof bankingPeerToPeerTransfers.$inferInsert;
