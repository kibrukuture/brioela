import { z } from "@brioela/shared/zod";
import {
  BankingCurrency,
  PayoutStatus,
} from "@brioela/shared/drizzle/schema/banking-enums.schema";
import { payRequestBankDetailsSchema } from "@brioela/shared/validators/pay-request.validator";
import { TRANSFER_PURPOSES } from "@brioela/shared/constants/transfer-purposes";

export const amountAtomicSchema = z
  .string()
  .regex(/^\d+$/, "Invalid amountAtomic");

export const createOutgoingPayoutSchema = z
  .object({
    amountAtomic: amountAtomicSchema,
    currency: z.enum(BankingCurrency.enumValues),

    // bank details includes bankName and the rail-specific info
    bankDetails: payRequestBankDetailsSchema,

    // recipient name from UI (must be what user enters)
    recipientFullName: z
      .string()
      .trim()
      .min(1, "Recipient full name is required"),

    transferPurpose: z.enum(TRANSFER_PURPOSES),

    saveRecipient: z.boolean().default(false),
    label: z.string().trim().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.saveRecipient && !val.label) {
      ctx.addIssue({
        code: "custom",
        message: "Label is required when saving recipient",
        path: ["label"],
      });
    }
  });

export type CreateOutgoingPayoutInput = z.infer<
  typeof createOutgoingPayoutSchema
>;

export const outgoingPayoutSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  amountAtomic: z.string(),
  currency: z.enum(BankingCurrency.enumValues),
  status: z.enum(PayoutStatus.enumValues),
  destinationExternalAccountId: z.uuid().nullable(),
  providerTransferId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OutgoingPayout = z.infer<typeof outgoingPayoutSchema>;

export const createOutgoingPayoutResponseSchema = z.object({
  payout: outgoingPayoutSchema,
});

export type CreateOutgoingPayoutResponse = z.infer<
  typeof createOutgoingPayoutResponseSchema
>;

export const executeOutgoingPayoutJobSchema = z.object({
  type: z.literal("banking.outgoing_payout_execute"),
  payoutId: z.uuid(),
  transferPurpose: z.enum(TRANSFER_PURPOSES),
});

export type ExecuteOutgoingPayoutJobInput = z.infer<
  typeof executeOutgoingPayoutJobSchema
>;
