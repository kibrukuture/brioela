import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";
import { integer, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const challenges = schnlSchema
  .table("challenges", {
    id: uuid("id").defaultRandom().primaryKey(),

    purpose: text("purpose").notNull(),

    subjectType: text("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),

    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),

    tokenHash: text("token_hash").notNull(),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),

    consumedByUserId: uuid("consumed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    attemptCount: integer("attempt_count").default(0).notNull(),
    maxAttempts: integer("max_attempts"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
