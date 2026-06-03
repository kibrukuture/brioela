import { text, timestamp, uuid } from "drizzle-orm/pg-core";
import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";
import { users } from "@brioela/shared/drizzle/schema/user.schema";

export const communicationCodes = schnlSchema
  .table("communication_codes", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    // Encrypted communication code (shared secret for email verification)
    encryptedCode: text("encrypted_code").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type CommunicationCode = typeof communicationCodes.$inferSelect;
export type NewCommunicationCode = typeof communicationCodes.$inferInsert;
