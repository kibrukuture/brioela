import { z } from "@brioela/shared/zod";

export const createActivationChallengeSchema = z.object({
  walletAddress: z.string().refine((val) => {
    const isEvm = /^0x[a-fA-F0-9]{40}$/.test(val);
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val);
    return isEvm || isSolana;
  }, "Invalid Wallet Address (Must be EVM or Solana)"),
});
export type CreateActivationChallengeInput = z.infer<
  typeof createActivationChallengeSchema
>;

export const createActivationChallengeResponseSchema = z.object({
  challengeId: z.string().min(1),
  challenge: z.object({
    nonce: z.string().min(1),
    expiresAt: z.date(),
    purpose: z.literal("activate_wallet"),
    address: z.string().refine((val) => {
      const isEvm = /^0x[a-fA-F0-9]{40}$/.test(val);
      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val);
      return isEvm || isSolana;
    }, "Invalid Wallet Address (Must be EVM or Solana)"),
  }),
});
export type CreateActivationChallengeResponse = z.infer<
  typeof createActivationChallengeResponseSchema
>;
