import { z } from "@brioela/shared/zod";

export const mintInAppNotificationsWsTicketResponseSchema = z.object({
  ticket: z.string().min(1),
  expiresAt: z.coerce.date(),
});
export type MintInAppNotificationsWsTicketResponse = z.infer<
  typeof mintInAppNotificationsWsTicketResponseSchema
>;
