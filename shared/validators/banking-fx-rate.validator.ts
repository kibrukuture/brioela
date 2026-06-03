import { z } from "@brioela/shared/zod";

export const getBankingFxRateQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

export type GetBankingFxRateQuery = z.infer<typeof getBankingFxRateQuerySchema>;

export const getBankingFxRateResponseSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  rate: z.string().min(1),
  asOf: z.coerce.date(),
});

export type GetBankingFxRateResponse = z.infer<
  typeof getBankingFxRateResponseSchema
>;
