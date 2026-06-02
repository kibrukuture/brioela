import { z } from "@schnl/shared/zod";
import { bankingTransactionAttachmentSchema } from "@schnl/shared/validators/banking-transaction-attachment.validator";

export const bankingTransactionAttachmentParamsSchema = z.object({
  id: z.uuid(),
  attachmentId: z.string().min(1),
});

export type BankingTransactionAttachmentParams = z.infer<
  typeof bankingTransactionAttachmentParamsSchema
>;

export const uploadBankingTransactionAttachmentResponseSchema = z.object({
  ok: z.literal(true),
  attachment: bankingTransactionAttachmentSchema,
});

export type UploadBankingTransactionAttachmentResponse = z.infer<
  typeof uploadBankingTransactionAttachmentResponseSchema
>;

export const deleteBankingTransactionAttachmentResponseSchema = z.object({
  ok: z.literal(true),
});

export type DeleteBankingTransactionAttachmentResponse = z.infer<
  typeof deleteBankingTransactionAttachmentResponseSchema
>;

export const emailBankingTransactionReceiptResponseSchema = z.object({
  ok: z.literal(true),
});

export type EmailBankingTransactionReceiptResponse = z.infer<
  typeof emailBankingTransactionReceiptResponseSchema
>;
