import { z } from "@schnl/shared/zod";
import { bankingVirtualAccounts } from "@schnl/shared/drizzle/schema/banking-virtual-accounts.schema";
import { BankingCurrency } from "@schnl/shared/drizzle/schema/banking-enums.schema";

export const alignVirtualAccountSourceCurrencyValues = [
  "usd",
  "eur",
  "aed",
] as const;

export const kycLinkResponseSchema = z.object({
  kycLink: z.url(),
});

export type KycLinkResponse = z.infer<typeof kycLinkResponseSchema>;

export const createVirtualAccountSchema = z.object({
  currency: z.enum(alignVirtualAccountSourceCurrencyValues),
});

export type CreateVirtualAccountInput = z.infer<
  typeof createVirtualAccountSchema
>;

export type CreateVirtualAccountResponse =
  typeof bankingVirtualAccounts.$inferSelect;

export type ListVirtualAccountsResponse = CreateVirtualAccountResponse[];

export const removeVirtualAccountSchema = z.object({
  currency: z.enum(alignVirtualAccountSourceCurrencyValues),
  email: z.email(),
});

export type RemoveVirtualAccountInput = z.infer<
  typeof removeVirtualAccountSchema
>;

export const removeVirtualAccountResponseSchema = z.object({
  currency: z.enum(alignVirtualAccountSourceCurrencyValues),
  removed: z.boolean(),
});

export type RemoveVirtualAccountResponse = z.infer<
  typeof removeVirtualAccountResponseSchema
>;

export const activateWalletSchema = z.object({
  signature: z.string().min(1, "Signature required"),
  challengeId: z.string().min(1, "Challenge ID required"),
  // Support both EVM (0x...) and Solana (Base58)
  walletAddress: z.string().refine((val) => {
    const isEvm = /^0x[a-fA-F0-9]{40}$/.test(val);
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val);
    return isEvm || isSolana;
  }, "Invalid Wallet Address (Must be EVM or Solana)"),
});

export type ActivateWalletResponse = typeof bankingVirtualAccounts.$inferSelect;

export type ActivateWalletInput = z.infer<typeof activateWalletSchema>;

export const sessionConfigResponseSchema = z.object({
  sessionKeyAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().int().positive(),

  // approvedTargets is the allow-list of contract addresses the session
  // key is permitted to call. These are EVM 0x… contract addresses,
  //  not user EOAs.
  approvedTargets: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).optional(),
  // It only limits sending native token (MATIC on Polygon).
  // USDC transfers via contract calls are unaffected.
  // example:  If your flow is USDC-only, set nativeTokenLimitPerTransaction = 0 and
  // rely on approvedTargets plus backend policies for USDC amounts.
  nativeTokenLimitPerTransaction: z.string().regex(/^\d+$/).optional(),

  permissionStartTimestamp: z.date(),
  permissionEndTimestamp: z.date(),
});

export type SessionConfigResponse = z.infer<typeof sessionConfigResponseSchema>;

export const registerSessionSchema = z.object({
  walletAddress: z.string().refine((val) => {
    const isEvm = /^0x[a-fA-F0-9]{40}$/.test(val);
    const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val);
    return isEvm || isSolana;
  }),
  sessionKeyAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().int().positive(),
  approvedTargets: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).optional(),
  nativeTokenLimitPerTransaction: z.string().regex(/^\d+$/).optional(),
  expiresAt: z.coerce.date(),
});

export type RegisterSessionInput = z.infer<typeof registerSessionSchema>;

export const registerSessionResponseSchema = z.object({
  id: z.string().min(1),
  sessionKeyAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  expiresAt: z.date(),
  status: z.enum(["active", "revoked", "expired"]),
});

export type RegisterSessionResponse = z.infer<
  typeof registerSessionResponseSchema
>;

export const sessionStatusResponseSchema = z.object({
  status: z.enum(["missing", "active", "expired", "revoked"]),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  sessionKeyAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  expiresAt: z.date().optional(),
});

export type SessionStatusResponse = z.infer<typeof sessionStatusResponseSchema>;

export const embeddedWalletResponseSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export type EmbeddedWalletResponse = z.infer<
  typeof embeddedWalletResponseSchema
>;
