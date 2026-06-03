import {
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { brioelaSchema } from "@brioela/shared/drizzle/schema/brioela";
import { users } from "@brioela/shared/drizzle/schema/user.schema";

export const InAppNotificationType = brioelaSchema.enum(
  "in_app_notification_type",
  [
    "payment",
    "alert",
    "transaction",
    "security",
    "system",
    // Add more types as needed
  ]
);

export const inAppNotifications = brioelaSchema
  .table(
    "in_app_notifications",
    {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
      title: text("title").notNull(),
      body: text("body").notNull(),
      type: InAppNotificationType("type").notNull(),

      link: text("link"),
      actionLabel: text("action_label"),
      metadata: jsonb("metadata"),

      isRead: boolean("is_read").default(false).notNull(),
      isDeleted: boolean("is_deleted").default(false).notNull(),

      createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),

      readAt: timestamp("read_at", { withTimezone: true }),
    },
    (table) => [index("user_id_idx").on(table.userId)]
  )
  .enableRLS();

export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type NewInAppNotification = typeof inAppNotifications.$inferInsert;
