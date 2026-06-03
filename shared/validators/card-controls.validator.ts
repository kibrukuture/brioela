import { z } from "@brioela/shared/zod";

export const cardControlKeys = [
  "onlinePayments",
  "magneticStripe",
  "contactless",
  "chipTransactions",
  "mobileWallet",
  "cashWithdrawals",
  "non3dSecure",
  "overseasPayments",
] as const;

export const updateCardControlsSchema = z
  .object({
    cardId: z.string().min(1, "cardId is required"),
    controls: z
      .object({
        onlinePayments: z.boolean().optional(),
        magneticStripe: z.boolean().optional(),
        contactless: z.boolean().optional(),
        chipTransactions: z.boolean().optional(),
        mobileWallet: z.boolean().optional(),
        cashWithdrawals: z.boolean().optional(),
        non3dSecure: z.boolean().optional(),
        overseasPayments: z.boolean().optional(),
      })
      .strict(),
  })
  .refine(
    (data) =>
      Object.values(data.controls).some((value) => typeof value === "boolean"),
    { message: "At least one control toggle must be provided" }
  );

export type UpdateCardControlsInput = z.infer<typeof updateCardControlsSchema>;
export type CardControlKey = (typeof cardControlKeys)[number];

export type CardControlsState = {
  cardId: string;
} & Record<CardControlKey, boolean>;
