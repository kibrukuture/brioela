import { boolean, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { schnlSchema } from "@schnl/shared/drizzle/schema/schnl";
import { users } from "@schnl/shared/drizzle/schema/user.schema";

export const NotificationProvider = schnlSchema.enum("notification_provider", [
  "expo",
  "apns",
  "fcm",
]);

export const pushNotification = schnlSchema
  .table("push_notification", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    provider: NotificationProvider("provider"),
    token: text("token").notNull(),
    platform: text("platform"),
    model: text("model"),
    active: boolean("active").notNull().default(true),
    registeredAt: timestamp("registered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  })
  .enableRLS();

export type PushNotification = typeof pushNotification.$inferSelect;
export type NewPushNotification = typeof pushNotification.$inferInsert;

