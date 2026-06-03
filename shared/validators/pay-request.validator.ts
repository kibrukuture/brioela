import { z } from "@brioela/shared/zod";
import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";
import { PayRequestStatus } from "@brioela/shared/drizzle/schema/banking-pay-requests.schema";
import { TRANSFER_PURPOSES } from "@brioela/shared/constants/transfer-purposes";
import { PAYOUT_CURRENCIES } from "@brioela/shared/constants";

export const bankingCurrencySchema = z.enum(BankingCurrency.enumValues);
export type BankingCurrencyCode = z.infer<typeof bankingCurrencySchema>;

export const amountAtomicSchema = z
  .string()
  .regex(/^\d+$/, "Invalid amountAtomic");

export const createPayRequestByEmailSchema = z.object({
  recipientEmail: z.email(),
  recipientName: z.string().min(1).optional(),

  amountAtomic: amountAtomicSchema,

  sourceCurrency: bankingCurrencySchema,

  payoutCurrency: z.literal(PAYOUT_CURRENCIES.usd),
});
export type CreatePayRequestByEmailInput = z.infer<
  typeof createPayRequestByEmailSchema
>;

export const payRequestStatusSchema = z.enum(PayRequestStatus.enumValues);
export type PayRequestStatus = z.infer<typeof payRequestStatusSchema>;

export const payRequestIdParamSchema = z.object({
  id: z.uuid(),
});
export type PayRequestIdParam = z.infer<typeof payRequestIdParamSchema>;

export const payRequestSchema = z.object({
  id: z.string().min(1),
  senderUserId: z.string().min(1),

  senderFirstName: z.string().nullable().optional(),
  senderLastName: z.string().nullable().optional(),

  recipientEmail: z.email(),
  recipientName: z.string().nullable().optional(),

  amountAtomic: amountAtomicSchema,
  sourceCurrency: bankingCurrencySchema,
  payoutCurrency: bankingCurrencySchema,

  transferPurpose: z.enum(TRANSFER_PURPOSES).nullable().optional(),

  providerTransferId: z.string().min(1).nullable().optional(),

  status: payRequestStatusSchema,

  expiresAt: z.coerce.date(),
  claimedAt: z.coerce.date().nullable().optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  payoutDetailsSubmittedAt: z.coerce.date().nullable().optional(),
  failedAt: z.coerce.date().nullable().optional(),
  failureReason: z.string().nullable().optional(),

  createdAt: z.coerce.date(),
});
export type PayRequest = z.infer<typeof payRequestSchema>;

export const expirePayRequestJobPayloadSchema = z.object({
  type: z.literal("banking.pay_request_expire"),
  payRequestId: z.uuid(),
});
export type ExpirePayRequestJobPayloadInput = z.infer<
  typeof expirePayRequestJobPayloadSchema
>;

export const executePayRequestPayoutJobPayloadSchema = z.object({
  type: z.literal("banking.pay_request_execute_payout"),
  payRequestId: z.uuid(),
});
export type ExecutePayRequestPayoutJobPayloadInput = z.infer<
  typeof executePayRequestPayoutJobPayloadSchema
>;

export const createPayRequestByEmailResponseSchema = z.object({
  payRequest: payRequestSchema,
});
export type CreatePayRequestByEmailResponse = z.infer<
  typeof createPayRequestByEmailResponseSchema
>;

export const claimPayRequestSchema = z.object({
  token: z.string().min(1),
});
export type ClaimPayRequestInput = z.infer<typeof claimPayRequestSchema>;

export const claimPayRequestResponseSchema = z.object({
  payRequestId: z.string().min(1),
  claimed: z.boolean(),
});
export type ClaimPayRequestResponse = z.infer<
  typeof claimPayRequestResponseSchema
>;

export const getPayRequestResponseSchema = z.object({
  payRequest: payRequestSchema,
});
export type GetPayRequestResponse = z.infer<typeof getPayRequestResponseSchema>;

export const cancelPayRequestResponseSchema = z.object({
  payRequestId: z.string().min(1),
  cancelled: z.boolean(),
});
export type CancelPayRequestResponse = z.infer<
  typeof cancelPayRequestResponseSchema
>;

export const payRequestPayoutRegionSchema = z.enum([
  "inside_europe",
  "outside_europe",
]);
export type PayRequestPayoutRegion = z.infer<
  typeof payRequestPayoutRegionSchema
>;

export const payRequestBankDetailsSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("ach"),
    bankName: z.string().trim().min(1),
    accountNumber: z.string().min(4),
    routingNumber: z.string().length(9),
    accountType: z.enum(["checking", "savings"]),
  }),
  z.object({
    type: z.literal("iban_sepa"),
    bankName: z.string().trim().min(1),
    iban: z.string().min(15),
    swift: z.string().min(6),
  }),
  z.object({
    type: z.literal("iban_single"),
    bankName: z.string().trim().min(1),
    iban: z.string().min(15),
    swift: z.string().min(6),
  }),
]);
export type PayRequestBankDetails = z.infer<typeof payRequestBankDetailsSchema>;

export const submitPayRequestPayoutDetailsSchema = z.object({
  bankDetails: payRequestBankDetailsSchema,
  transferPurpose: z.enum(TRANSFER_PURPOSES),
});
export type SubmitPayRequestPayoutDetailsInput = z.infer<
  typeof submitPayRequestPayoutDetailsSchema
>;

export const submitPayRequestPayoutDetailsResponseSchema = z.object({
  payRequestId: z.string().min(1),
  submitted: z.boolean(),
});
export type SubmitPayRequestPayoutDetailsResponse = z.infer<
  typeof submitPayRequestPayoutDetailsResponseSchema
>;
