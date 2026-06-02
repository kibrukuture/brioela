import { z } from "@schnl/shared/zod";

export const bankingBalanceItemSchema = z.object({
  currency: z.string().min(1),
  availableAtomic: z.string().regex(/^\d+$/, "Invalid availableAtomic"),
  heldAtomic: z.string().regex(/^\d+$/, "Invalid heldAtomic"),
});

export type BankingBalanceItem = z.infer<typeof bankingBalanceItemSchema>;

export const listBankingBalancesResponseSchema = z.object({
  balances: z.array(bankingBalanceItemSchema),
});

export type ListBankingBalancesResponse = z.infer<
  typeof listBankingBalancesResponseSchema
>;
