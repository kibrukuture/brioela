import { z } from "@brioela/shared/zod";
import { SUPPORTED_BANKING_CURRENCY_CODES } from "@brioela/shared/constants";
import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";
import { payRequestBankDetailsSchema } from "@brioela/shared/validators/pay-request.validator";

const supportedBankingCurrencySchema = z.enum(SUPPORTED_BANKING_CURRENCY_CODES);

export const bankingRecipientListItemSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  label: z.string().min(1),
  accountHolderName: z.string().min(1),
  accountHolderType: z.string().min(1),
  bankName: z.string().optional().nullable(),
  countryCode: z.string().min(1),
  currency: supportedBankingCurrencySchema,
  iban: z.string().optional().nullable(),
  bic: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  routingNumber: z.string().optional().nullable(),
  accountType: z.string().optional().nullable(),
  sortCode: z.string().optional().nullable(),
  streetLine1: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

export type BankingRecipientListItem = z.infer<
  typeof bankingRecipientListItemSchema
>;

export const listBankingRecipientsResponseSchema = z.object({
  recipients: z.array(bankingRecipientListItemSchema),
});

export type ListBankingRecipientsResponse = z.infer<
  typeof listBankingRecipientsResponseSchema
>;

export const bankingRecipientIdParamSchema = z.object({
  id: z.string().min(1),
});

export type BankingRecipientIdParam = z.infer<
  typeof bankingRecipientIdParamSchema
>;

export const getBankingRecipientResponseSchema = z.object({
  recipient: bankingRecipientListItemSchema,
});

export type GetBankingRecipientResponse = z.infer<
  typeof getBankingRecipientResponseSchema
>;

export const createBankingRecipientSchema = z.object({
  label: z.string().trim().min(1),
  recipientFullName: z.string().trim().min(1),
  currency: z.enum(BankingCurrency.enumValues),
  bankDetails: payRequestBankDetailsSchema,
});

export type CreateBankingRecipientInput = z.infer<
  typeof createBankingRecipientSchema
>;

export const createBankingRecipientResponseSchema = z.object({
  ok: z.literal(true),
});

export type CreateBankingRecipientResponse = z.infer<
  typeof createBankingRecipientResponseSchema
>;

export const deleteBankingRecipientResponseSchema = z.object({
  ok: z.literal(true),
});

export type DeleteBankingRecipientResponse = z.infer<
  typeof deleteBankingRecipientResponseSchema
>;
