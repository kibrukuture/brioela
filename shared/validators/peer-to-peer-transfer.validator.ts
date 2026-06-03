import { z } from "@brioela/shared/zod";
import { BankingCurrency } from "@brioela/shared/drizzle/schema/banking-enums.schema";
import { TRANSFER_PURPOSES } from "@brioela/shared/constants/transfer-purposes";

export const createPeerToPeerTransferSchema = z.object({
  recipientUserId: z.uuid(),
  amountAtomic: z.string().regex(/^\d+$/, "Invalid amountAtomic"),
  currency: z.enum(BankingCurrency.enumValues),
  transferPurpose: z.enum(TRANSFER_PURPOSES),
});

export type CreatePeerToPeerTransferInput = z.infer<
  typeof createPeerToPeerTransferSchema
>;

export const createPeerToPeerTransferResponseSchema = z.object({
  transferId: z.uuid(),
});

export type CreatePeerToPeerTransferResponse = z.infer<
  typeof createPeerToPeerTransferResponseSchema
>;

export const executePeerToPeerTransferJobSchema = z.object({
  type: z.literal("banking.peer_to_peer_execute"),
  transferId: z.uuid(),
});

export type ExecutePeerToPeerTransferJobInput = z.infer<
  typeof executePeerToPeerTransferJobSchema
>;
