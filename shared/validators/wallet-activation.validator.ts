import { z } from "@schnl/shared/zod";

export const walletActivationFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type WalletActivationForm = z.infer<typeof walletActivationFormSchema>;
