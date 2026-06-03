import { z } from "@brioela/shared/zod";
import { createOutgoingPayoutSchema } from "@brioela/shared/validators/outgoing-payout.validator";

export const outgoingPayoutPrecheckSchema = createOutgoingPayoutSchema;

export type OutgoingPayoutPrecheckInput = z.infer<
  typeof outgoingPayoutPrecheckSchema
>;

export const outgoingPayoutPrecheckIssueSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export const outgoingPayoutPrecheckResponseSchema = z
  .object({
    ok: z.boolean(),
    issues: z.array(outgoingPayoutPrecheckIssueSchema),
  })
  .strict();

export type OutgoingPayoutPrecheckResponse = z.infer<
  typeof outgoingPayoutPrecheckResponseSchema
>;
