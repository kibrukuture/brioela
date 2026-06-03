import { z } from "@brioela/shared/zod";

export const runOfframpOutboxQueueJobSchema = z.object({
  type: z.literal("banking.offramp_outbox_process"),
  outboxId: z.uuid(),
});

export type RunOfframpOutboxQueueJobInput = z.infer<
  typeof runOfframpOutboxQueueJobSchema
>;
