import { z } from "@brioela/shared/zod";
import { bankingCurrencyValues } from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const bankingLimitScopeSchema = z.enum(["card", "transfer"]);
export type BankingLimitScope = z.infer<typeof bankingLimitScopeSchema>;

export const bankingLimitPeriodSchema = z.enum(["daily", "weekly", "monthly"]);
export type BankingLimitPeriod = z.infer<typeof bankingLimitPeriodSchema>;

export const bankingLimitItemSchema = z.object({
  currency: z.enum(bankingCurrencyValues),
  scope: bankingLimitScopeSchema,
  period: bankingLimitPeriodSchema,
  amountAtomic: z.string().regex(/^\d+$/, "Invalid amountAtomic"),
});

export const getBankingLimitsResponseSchema = z.object({
  limits: z.array(bankingLimitItemSchema),
});

export type GetBankingLimitsResponse = z.infer<
  typeof getBankingLimitsResponseSchema
>;

export const updateBankingLimitInputSchema = bankingLimitItemSchema;
export type UpdateBankingLimitInput = z.infer<
  typeof updateBankingLimitInputSchema
>;

export const updateBankingLimitResponseSchema = z.object({
  limit: bankingLimitItemSchema,
});

export type UpdateBankingLimitResponse = z.infer<
  typeof updateBankingLimitResponseSchema
>;
