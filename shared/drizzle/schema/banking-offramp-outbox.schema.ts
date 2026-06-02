import { sql } from "@schnl/shared/drizzle";
import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import {
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { BankingTransactionReferenceType } from "@schnl/shared/drizzle/schema/banking-enums.schema";

export const OfframpOutboxStatus = schnlSchema.enum(
  "banking_offramp_outbox_status",
  ["pending", "in_progress", "done", "failed"]
);

export const bankingOfframpOutbox = schnlSchema
  .table(
    "banking_offramp_outbox",
    {
      id: uuid("id").defaultRandom().primaryKey(),

      referenceType:
        BankingTransactionReferenceType("reference_type").notNull(),
      referenceId: uuid("reference_id").notNull(),

      payload: jsonb("payload"),

      status: OfframpOutboxStatus("status").default("pending").notNull(),
      attempt: integer("attempt").default(0).notNull(),
      maxAttempts: integer("max_attempts").default(8).notNull(),

      nextRunAt: timestamp("next_run_at", { withTimezone: true })
        .notNull()
        .defaultNow(),

      lockedAt: timestamp("locked_at", { withTimezone: true }),
      lockedBy: text("locked_by"),

      dedupeKey: text("dedupe_key"),
      lastError: text("last_error"),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
      updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      uniqueIndex("banking_offramp_outbox_dedupe_key_unique")
        .on(table.dedupeKey)
        .where(sql`${table.dedupeKey} IS NOT NULL`),
    ]
  )
  .enableRLS();

export type BankingOfframpOutbox = typeof bankingOfframpOutbox.$inferSelect;
export type NewBankingOfframpOutbox = typeof bankingOfframpOutbox.$inferInsert;
