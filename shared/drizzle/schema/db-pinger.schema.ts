// this is only used to ping the supabase database to keep it alive.
import { timestamp, uuid } from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";

export const dbPingers = brioelaSchema
  .table("db_pingers", {
    id: uuid("id").defaultRandom().primaryKey(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

// Export types
export type DbPinger = typeof dbPingers.$inferSelect;
export type NewDbPinger = typeof dbPingers.$inferInsert;
