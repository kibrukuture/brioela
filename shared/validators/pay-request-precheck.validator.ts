import { z } from "@brioela/shared/zod";
import { payRequestIdParamSchema } from "@brioela/shared/validators/pay-request.validator";
import { submitPayRequestPayoutDetailsSchema } from "@brioela/shared/validators/pay-request.validator";

export const payRequestPayoutPrecheckParamsSchema = payRequestIdParamSchema;

export type PayRequestPayoutPrecheckParams = z.infer<
  typeof payRequestPayoutPrecheckParamsSchema
>;

export const payRequestPayoutPrecheckSchema =
  submitPayRequestPayoutDetailsSchema;

export type PayRequestPayoutPrecheckInput = z.infer<
  typeof payRequestPayoutPrecheckSchema
>;

export const payRequestPayoutPrecheckIssueSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export const payRequestPayoutPrecheckResponseSchema = z
  .object({
    ok: z.boolean(),
    issues: z.array(payRequestPayoutPrecheckIssueSchema),
  })
  .strict();

export type PayRequestPayoutPrecheckResponse = z.infer<
  typeof payRequestPayoutPrecheckResponseSchema
>;
