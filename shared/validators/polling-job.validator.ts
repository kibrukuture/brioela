import { z } from "@schnl/shared/zod";

export const pollingJobPayloadSchema = z.object({
  type: z.literal("polling"),
  jobId: z.string(),
});

export type PollingJobPayloadInput = z.infer<typeof pollingJobPayloadSchema>;
