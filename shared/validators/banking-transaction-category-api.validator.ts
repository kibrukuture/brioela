import { z } from "@schnl/shared/zod";
import {
  bankingTransactionCategorySchema,
  bankingTransactionCategoryValues,
} from "@schnl/shared/validators/banking-transaction-category.validator";

export const bankingTransactionIdParamSchema = z.object({
  id: z.uuid(),
});

export type BankingTransactionIdParam = z.infer<
  typeof bankingTransactionIdParamSchema
>;

export const listBankingTransactionCategoriesResponseSchema = z.object({
  categories: z.array(bankingTransactionCategorySchema),
});

export type ListBankingTransactionCategoriesResponse = z.infer<
  typeof listBankingTransactionCategoriesResponseSchema
>;

export const setBankingTransactionCategoryInputSchema = z.object({
  category: bankingTransactionCategorySchema,
});

export type SetBankingTransactionCategoryInput = z.infer<
  typeof setBankingTransactionCategoryInputSchema
>;

export const setBankingTransactionCategoryResponseSchema = z.object({
  ok: z.literal(true),
});

export type SetBankingTransactionCategoryResponse = z.infer<
  typeof setBankingTransactionCategoryResponseSchema
>;

export const bankingTransactionCategoryList = bankingTransactionCategoryValues;
