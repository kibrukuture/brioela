export const BANKING_LEDGER_HOLD_REFERENCE_TYPES = {
  PAY_REQUEST: "pay_request",
  OUTGOING_PAYOUT: "outgoing_payout",
  PEER_TO_PEER: "peer_to_peer",
  CARD_ORDER: "card_order",
} as const;

export type BankingLedgerHoldReferenceType =
  (typeof BANKING_LEDGER_HOLD_REFERENCE_TYPES)[keyof typeof BANKING_LEDGER_HOLD_REFERENCE_TYPES];
