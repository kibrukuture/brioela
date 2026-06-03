import {
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  boolean,
  check,
} from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { sql } from "@brioela/shared/drizzle";

// Create the enum type
export const AccountAccessStatus = brioelaSchema.enum("account_access_status", [
  "blocked",
  "unblocked",
]);

// payment status enum.
export const PaymentStatus = brioelaSchema.enum("payment_status", [
  "active", // Paid and active
  "trialing", // In free trial
  "past_due", // Payment failed, in grace period
  "cancelled", // User cancelled, still active until period ends
  "expired", // Subscription ended
  "paused", // Temporarily paused
  "pending", // Payment processing
  "failed", // Payment failed permanently
  "refunded", // Full refund
  "partially_refunded", // Partial refund
  "incomplete", // Payment incomplete
]);

export const SubscriptionPlatform = brioelaSchema.enum("subscription_platform", [
  "APP_STORE", // iOS (Superwall calls it "APP_STORE")
  "PLAY_STORE", // Android (Superwall calls it "PLAY_STORE")
  "STRIPE", // Web/Stripe
  "PADDLE", // Coming soon
]);

// tier : monthly, yearly, lifetime, weekly
export const SubscriptionTier = brioelaSchema.enum("subscription_tier", [
  "monthly",
  "yearly",
  "lifetime",
  "weekly",
]);

export const BankingKycStatus = brioelaSchema.enum("banking_kyc_status", [
  "not_started",
  "pending",
  "approved",
  "rejected",
]);

export const users = brioelaSchema
  .table(
    "users",
    {
      id: uuid("id").defaultRandom().primaryKey(),

      // Existing fields
      firstName: text("first_name"),
      lastName: text("last_name"),
      email: text("email").notNull().unique(),
      bankingCustomerId: text("banking_customer_id").unique(),
      bankingKycStatus: BankingKycStatus("banking_kyc_status")
        .default("not_started")
        .notNull(),
      bankingKycUpdatedAt: timestamp("banking_kyc_updated_at", {
        withTimezone: true,
      }),
      membershipNumber: text("membership_number").unique(),
      profilePicture: text("profile_picture"),
      brioelaTag: text("brioela_tag").unique(),
      isDiscoverable: boolean("is_discoverable").default(false).notNull(),
      lastPaid: timestamp("last_paid", { withTimezone: true }),
      phone: text("phone"),
      subscriptionEndDate: timestamp("subscription_end_date", {
        withTimezone: true,
      }),
      // payment related fields.
      paymentSessionId: text("payment_session_id"),
      paymentCustomerId: text("payment_customer_id"),
      paymentCustomerDetails: text("payment_customer_details"),
      paymentSubscriptionId: text("payment_subscription_id"),
      paymentAuthProvider: text("payment_auth_provider"),
      paymentAmountTotal: text("payment_amount_total"),
      paymentInvoiceId: text("payment_invoice_id"),
      paymentMetadata: jsonb("payment_metadata"),
      paymentStatus: PaymentStatus("payment_status"),
      subscriptionPlatform: SubscriptionPlatform("subscription_platform"),
      subscriptionProductId: text("subscription_product_id"),
      subscriptionProductName: text("subscription_product_name"),
      subscriptionProductPrice: integer("subscription_product_price"),
      subscriptionProductCurrency: text("subscription_product_currency"),
      accountAccessStatus: AccountAccessStatus("account_access_status"),
      //

      // Superwall specific:
      superwallOriginalTransactionId: text("superwall_original_transaction_id"), // Subscription ID
      superwallOriginalAppUserId: text("superwall_original_app_user_id"), // First user ID
      // Trial info:
      isInTrial: boolean("is_in_trial").default(false),
      trialEndDate: timestamp("trial_end_date", { withTimezone: true }),
      // Product details:
      subscriptionPeriodType: text("subscription_period_type"), // "TRIAL", "INTRO", "NORMAL"
      // Cancellation tracking:
      cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
      cancelReason: text("cancel_reason"), // "BILLING_ERROR", "UNSUBSCRIBE", etc.
      // Environment:
      subscriptionEnvironment: text("subscription_environment"), // "PRODUCTION" or "SANDBOX"
      lastPasswordChange: timestamp("last_password_change", {
        withTimezone: true,
      }),

      subscriptionTier: SubscriptionTier("subscription_tier"),

      // timestamps:
      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      // CHECK constraint to validate membership number format
      // Format: I-XXXXXXXX or C-XXXXXXXX where X is from safe chars (28^8 combinations)
      check(
        "membership_number_format",
        sql`membership_number IS NULL OR membership_number ~ '^[IC]-[23456789ADEFGHJKLMNPQRTUVWXY]{8}$'`
      ),
      // CHECK constraint to validate SchnlTag format
      // Rules:
      // 1. Start with lowercase letter
      // 2. Middle: lowercase letters, numbers, dots, underscores
      // 3. End with lowercase letter or number
      // 4. No consecutive specials (checked by application logic, but basic regex here enforces char set and structure)
      // 5. Length 3-20 (1 start + 1-18 mid + 1 end = 3-20)
      check(
        "brioela_tag_format",
        sql`brioela_tag IS NULL OR brioela_tag ~ '^[a-z][a-z0-9._]{1,18}[a-z0-9]$'`
      ),
    ]
  )
  .enableRLS();

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
