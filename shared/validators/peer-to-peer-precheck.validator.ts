import { z } from "@brioela/shared/zod";
import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";

export const peerToPeerPrecheckSchema = z.object({
  recipientUserId: z.uuid(),
  currency: z.enum(BankingCurrency.enumValues),
});

export type PeerToPeerPrecheckInput = z.infer<typeof peerToPeerPrecheckSchema>;

export const peerToPeerPrecheckIssueSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
});

export const peerToPeerPrecheckResponseSchema = z
  .object({
    ok: z.boolean(),
    issues: z.array(peerToPeerPrecheckIssueSchema),
  })
  .strict();

export type PeerToPeerPrecheckResponse = z.infer<
  typeof peerToPeerPrecheckResponseSchema
>;
