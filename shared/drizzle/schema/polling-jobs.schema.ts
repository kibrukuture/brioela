import { integer, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";

export const PollingJobStatus = schnlSchema.enum("polling_job_status", [
  "pending",
  "in_progress",
  "done",
  "failed",
  "expired",
]);

export const pollingJobs = schnlSchema
  .table("polling_jobs", {
    id: uuid("id").defaultRandom().primaryKey(),

    provider: text("provider").notNull(), // e.g., 'align', 'providerX'
    operation: text("operation").notNull(), // e.g., 'fetch_kyc_status'

    internalId: text("internal_id"), // e.g., userId or local ref
    externalId: text("external_id"), // e.g., provider id
    context: jsonb("context"), // optional misc identifiers (avoid large payloads)
    payload: jsonb("payload"), // optional minimal handler payload

    status: PollingJobStatus("status").default("pending").notNull(),
    attempt: integer("attempt").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(8).notNull(),

    nextRunAt: timestamp("next_run_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ttlExpiry: timestamp("ttl_expiry", { withTimezone: true }).notNull(), // absolute expiry

    lastError: text("last_error"),
    dedupeKey: text("dedupe_key"), // optional unique key per resource/operation

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type PollingJob = typeof pollingJobs.$inferSelect;
export type NewPollingJob = typeof pollingJobs.$inferInsert;
