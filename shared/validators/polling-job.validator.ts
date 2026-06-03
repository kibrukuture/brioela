import { z } from "@brioela/shared/zod";

export const pollingJobPayloadSchema = z.object({
  type: z.literal("polling"),
  jobId: z.string(),
});

export type PollingJobPayloadInput = z.infer<typeof pollingJobPayloadSchema>;
