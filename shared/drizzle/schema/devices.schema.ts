import { boolean, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import { users } from "@schnl/shared/drizzle/schema/user.schema";

export const devices = schnlSchema
  .table("devices", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    platform: text("platform"),
    model: text("model"),
    fingerprint: jsonb("fingerprint"),
    pushToken: text("push_token"),
    trusted: boolean("trusted").default(false).notNull(),
    boundAt: timestamp("bound_at", { withTimezone: true }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  })
  .enableRLS();

export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
