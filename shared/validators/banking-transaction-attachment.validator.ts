import { z } from "@brioela/shared/zod";

export const bankingTransactionAttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  url: z.string().min(1),
  fileKey: z.string().min(1),
  createdAt: z.string().min(1),
});

export type BankingTransactionAttachment = z.infer<
  typeof bankingTransactionAttachmentSchema
>;
