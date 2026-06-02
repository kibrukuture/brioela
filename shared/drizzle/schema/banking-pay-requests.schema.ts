import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import { users } from "@schnl/shared/drizzle/schema/user.schema";
import { BankingCurrency } from "@schnl/shared/drizzle/schema/banking-enums.schema";
import { text, timestamp, uuid, bigint } from "drizzle-orm/pg-core";

export const PayRequestStatus = schnlSchema.enum("banking_pay_request_status", [
  "created",
  "waiting_for_claim",
  "claimed",
  "expired",
  "cancelled",
  "in_flight",
  "processing",
  "completed",
  "failed",
]);

export const bankingPayRequests = schnlSchema
  .table("banking_pay_requests", {
    id: uuid("id").defaultRandom().primaryKey(),

    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    recipientEmail: text("recipient_email").notNull(),
    recipientName: text("recipient_name"),

    amountAtomic: bigint("amount_atomic", { mode: "bigint" }).notNull(),

    sourceCurrency: BankingCurrency("source_currency").notNull(),
    payoutCurrency: BankingCurrency("payout_currency").notNull(),

    transferPurpose: text("transfer_purpose"),

    providerTransferId: text("provider_transfer_id"),
    providerTxHash: text("provider_tx_hash"),

    status: PayRequestStatus("status").notNull(),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Recipient payout/bank details (encrypted JSON)
    encryptedPayoutDetails: text("encrypted_payout_details"),
    payoutDetailsSubmittedAt: timestamp("payout_details_submitted_at", {
      withTimezone: true,
    }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type BankingPayRequest = typeof bankingPayRequests.$inferSelect;
export type NewBankingPayRequest = typeof bankingPayRequests.$inferInsert;
