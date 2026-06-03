import { z } from "@brioela/shared/zod";
import { InAppNotificationType } from "@brioela/shared/drizzle/schema/in-app-notification.schema";

export const inAppNotificationTypeSchema = z.enum(
  InAppNotificationType.enumValues
);
export type InAppNotificationType = z.infer<typeof inAppNotificationTypeSchema>;

export const inAppNotificationIdParamSchema = z.object({
  id: z.uuid(),
});
export type InAppNotificationIdParam = z.infer<
  typeof inAppNotificationIdParamSchema
>;

export const inAppNotificationSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  type: inAppNotificationTypeSchema,

  link: z.string().nullable().optional(),
  actionLabel: z.string().nullable().optional(),
  metadata: z.unknown().nullable().optional(),

  isRead: z.boolean(),
  isDeleted: z.boolean(),

  createdAt: z.coerce.date(),
  readAt: z.coerce.date().nullable().optional(),
});
export type InAppNotification = z.infer<typeof inAppNotificationSchema>;

export const listInAppNotificationsResponseSchema = z.object({
  notifications: inAppNotificationSchema.array(),
});
export type ListInAppNotificationsResponse = z.infer<
  typeof listInAppNotificationsResponseSchema
>;

export const updateInAppNotificationSchema = z
  .object({
    isRead: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  })
  .refine((d) => d.isRead !== undefined || d.isDeleted !== undefined, {
    message: "At least one field must be provided",
  });
export type UpdateInAppNotificationInput = z.infer<
  typeof updateInAppNotificationSchema
>;

export const updateInAppNotificationResponseSchema = z.object({
  notification: inAppNotificationSchema,
});
export type UpdateInAppNotificationResponse = z.infer<
  typeof updateInAppNotificationResponseSchema
>;

export const markAllInAppNotificationsReadResponseSchema = z.object({
  updated: z.number().int().nonnegative(),
});
export type MarkAllInAppNotificationsReadResponse = z.infer<
  typeof markAllInAppNotificationsReadResponseSchema
>;

export const createInAppNotificationSchema = z.object({
  userId: z.uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  type: inAppNotificationTypeSchema,
  link: z.string().optional(),
  actionLabel: z.string().optional(),
  metadata: z.unknown().optional(),
});
export type CreateInAppNotificationInput = z.infer<
  typeof createInAppNotificationSchema
>;
