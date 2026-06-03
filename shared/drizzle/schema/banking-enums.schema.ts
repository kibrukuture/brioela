import { schnlSchema } from "@brioela/shared/drizzle/schema/schnl";

export const BankingRail = schnlSchema.enum("banking_rail", [
  "ach",
  "wire",
  "sepa",
  "swift",
  "uaefts",
]);

export const BankAccountType = schnlSchema.enum("bank_account_type", [
  "checking",
  "savings",
]);

export const HolderType = schnlSchema.enum("holder_type", [
  "individual",
  "business",
  "corporate",
]);

export const CardStatus = schnlSchema.enum("banking_card_status", [
  "active",
  "frozen",
  "cancelled",
  "pending",
]);

export const CardType = schnlSchema.enum("banking_card_type", [
  "virtual",
  "physical",
]);

export const CardBrand = schnlSchema.enum("banking_card_brand", [
  "mastercard",
  "visa",
]);

export const TransactionStatus = schnlSchema.enum("banking_txn_status", [
  "pending",
  "completed",
  "failed",
  "declined",
]);

export const TransactionDirection = schnlSchema.enum("banking_txn_direction", [
  "credit",
  "debit",
]);

export const TransactionType = schnlSchema.enum("banking_txn_type", [
  "deposit",
  "withdrawal",
  "card_payment",
  "transfer_in",
  "transfer_out",
  "fee",
]);

export const AccountStatus = schnlSchema.enum("banking_account_status", [
  "active",
  "inactive",
  "suspended",
]);

export const bankingCurrencyValues = [
  "usd",
  "eur",
  "aed",
  "aud",
  "cad",
  "dkk",
  "hkd",
  "jpy",
  "nzd",
  "nok",
  "gbp",
  "sgd",
  "sek",
  "chf",
  "usdc",
  "usdt",
  "eurc",
  "dai",
  "wbtc",
  "eth",
] as const;

export const BankingCurrency = schnlSchema.enum(
  "banking_currency",
  bankingCurrencyValues
);

export const CryptoNetwork = schnlSchema.enum("crypto_network", [
  "ethereum",
  "polygon",
  "base",
  "solana",
  "tron",
  "arbitrum",
]);

export const SessionStatus = schnlSchema.enum("session_status", [
  "active",
  "revoked",
  "expired",
]);

export const DepositMethod = schnlSchema.enum("deposit_method", [
  "card",
  "crypto",
  "bank_transfer",
]);

export const PayoutStatus = schnlSchema.enum("payout_status", [
  "created",
  "in_flight",
  "processing",
  "completed",
  "failed",
  "canceled",
]);

export const PeerToPeerTransferStatus = schnlSchema.enum(
  "banking_peer_to_peer_transfer_status",
  ["created", "in_flight", "processing", "completed", "failed"]
);

export const bankingTransactionReferenceTypeValues = [
  "pay_request",
  "outgoing_payout",
  "peer_to_peer",
  "card_order",
  "card_top_up",
  "crypto_send",
  "bank_transfer",
] as const;

export const BankingTransactionReferenceType = schnlSchema.enum(
  "banking_txn_reference_type",
  bankingTransactionReferenceTypeValues
);
