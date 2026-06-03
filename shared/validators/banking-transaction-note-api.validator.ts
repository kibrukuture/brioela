import { z } from "@brioela/shared/zod";

export const bankingTransactionIdParamSchema = z.object({
  id: z.uuid(),
});

export type BankingTransactionIdParam = z.infer<
  typeof bankingTransactionIdParamSchema
>;

export const setBankingTransactionNoteInputSchema = z.object({
  note: z.string().min(1).max(2000).nullable(),
});

export type SetBankingTransactionNoteInput = z.infer<
  typeof setBankingTransactionNoteInputSchema
>;

export const setBankingTransactionNoteResponseSchema = z.object({
  ok: z.literal(true),
});

export type SetBankingTransactionNoteResponse = z.infer<
  typeof setBankingTransactionNoteResponseSchema
>;
