import { z } from "@schnl/shared/zod";
import { TRANSFER_PURPOSES } from "@schnl/shared/constants/transfer-purposes";

export const outgoingPayoutOfframpOutboxPayloadSchema = z
  .object({
    transferPurpose: z.enum(TRANSFER_PURPOSES).optional(),
  })
  .strict();

export type OutgoingPayoutOfframpOutboxPayload = z.infer<
  typeof outgoingPayoutOfframpOutboxPayloadSchema
>;

export const peerToPeerOfframpOutboxPayloadSchema = z.object({}).strict();

export type PeerToPeerOfframpOutboxPayload = z.infer<
  typeof peerToPeerOfframpOutboxPayloadSchema
>;

export const payRequestOfframpOutboxPayloadSchema = z.object({}).strict();

export type PayRequestOfframpOutboxPayload = z.infer<
  typeof payRequestOfframpOutboxPayloadSchema
>;
