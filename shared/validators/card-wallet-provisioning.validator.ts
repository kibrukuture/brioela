import { z } from "@brioela/shared/zod";

export const cardWalletPlatformSchema = z.enum(["apple_wallet", "google_pay"]);
export type CardWalletPlatform = z.infer<typeof cardWalletPlatformSchema>;

export const cardWalletProvisioningResponseSchema = z.object({
  cardId: z.uuid(),
  platform: cardWalletPlatformSchema,
  message: z.string().min(1),
  expiresAt: z.string().min(1),
});

export type CardWalletProvisioningResponse = z.infer<
  typeof cardWalletProvisioningResponseSchema
>;
