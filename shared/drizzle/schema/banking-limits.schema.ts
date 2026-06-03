import { sql } from "@brioela/shared/drizzle";
import { bigint, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const BankingLimitScope = brioelaSchema.enum("banking_limit_scope", [
  "card",
  "transfer",
]);

export const BankingLimitPeriod = brioelaSchema.enum("banking_limit_period", [
  "daily",
  "weekly",
  "monthly",
]);

export const bankingLimits = brioelaSchema
  .table(
    "banking_limits",
    {
      id: uuid("id").defaultRandom().primaryKey(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
      currency: BankingCurrency("currency").notNull(),
      scope: BankingLimitScope("scope").notNull(),
      period: BankingLimitPeriod("period").notNull(),
      amountAtomic: bigint("amount_atomic", { mode: "bigint" })
        .default(sql`0`)
        .notNull(),
      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (t) => [
      uniqueIndex("banking_limits_user_currency_scope_period_unique").on(
        t.userId,
        t.currency,
        t.scope,
        t.period
      ),
    ]
  )
  .enableRLS();

export type BankingLimit = typeof bankingLimits.$inferSelect;
export type NewBankingLimit = typeof bankingLimits.$inferInsert;
