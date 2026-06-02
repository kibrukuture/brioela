import * as userSchema from "./user.schema";
import * as dbPingerSchema from "./db-pinger.schema";
import * as authSessionsSchema from "./auth-sessions.schema";
import * as authAccountsSchema from "./auth-accounts.schema";
import * as authVerificationsSchema from "./auth-verifications.schema";
import * as authSignatureChallengesSchema from "./auth-signature-challenges.schema";
import * as challengesSchema from "./challenges.schema";
import * as devicesSchema from "./devices.schema";
import * as cardControlsSchema from "./card-controls.schema";
import * as pushNotificationSchema from "./push-notification.schema";

import * as bankingEnumsSchema from "./banking-enums.schema";
import * as bankingVirtualAccountsSchema from "./banking-virtual-accounts.schema";
import * as bankingExternalAccountsSchema from "./banking-external-accounts.schema";
import * as bankingCryptoContactsSchema from "./banking-crypto-contacts.schema";
import * as bankingCardsSchema from "./banking-cards.schema";
import * as bankingCardOrdersSchema from "./banking-card-orders.schema";
import * as bankingTransactionsSchema from "./banking-transactions.schema";
import * as bankingPayRequestsSchema from "./banking-pay-requests.schema";
import * as bankingLedgerAccountsSchema from "./banking-ledger-accounts.schema";
import * as bankingLedgerEntriesSchema from "./banking-ledger-entries.schema";
import * as bankingLedgerHoldsSchema from "./banking-ledger-holds.schema";
import * as bankingWalletsSchema from "./banking-wallets.schema";
import * as bankingWalletSessionsSchema from "./banking-wallet-sessions.schema";
import * as bankingKycEventsSchema from "./banking-kyc-events.schema";
import * as bankingOutgoingPayoutsSchema from "./banking-outgoing-payouts.schema";
import * as bankingPeerToPeerTransfersSchema from "./banking-peer-to-peer-transfers.schema";
import * as bankingCustomerKycSchema from "./banking-customer-kyc.schema";
import * as bankingCustomerAddressesSchema from "./banking-customer-addresses.schema";
import * as bankingCustomerKycRailApprovalsSchema from "./banking-customer-kyc-rail-approvals.schema";
import * as bankingOfframpOutboxSchema from "./banking-offramp-outbox.schema";
import * as bankingProviderTransferMappingsSchema from "./banking-provider-transfer-mappings.schema";
import * as bankingLimitsSchema from "./banking-limits.schema";
import * as communicationCodesSchema from "./communication-codes.schema";
import * as pollingJobsSchema from "./polling-jobs.schema";
import * as inAppNotificationSchema from "./in-app-notification.schema";

// exports all schemas
export * from "./user.schema";
export * from "./db-pinger.schema";

export * from "./auth-sessions.schema";
export * from "./auth-accounts.schema";
export * from "./auth-verifications.schema";
export * from "./auth-signature-challenges.schema";
export * from "./challenges.schema";
export * from "./devices.schema";
export * from "./card-controls.schema";
export * from "./push-notification.schema";
export * from "./banking-enums.schema";
export * from "./banking-virtual-accounts.schema";
export * from "./banking-external-accounts.schema";
export * from "./banking-crypto-contacts.schema";
export * from "./banking-cards.schema";
export * from "./banking-card-orders.schema";
export * from "./banking-transactions.schema";
export * from "./banking-pay-requests.schema";
export * from "./banking-ledger-accounts.schema";
export * from "./banking-ledger-entries.schema";
export * from "./banking-ledger-holds.schema";
export * from "./banking-wallets.schema";
export * from "./banking-wallet-sessions.schema";
export * from "./banking-kyc-events.schema";
export * from "./banking-outgoing-payouts.schema";
export * from "./banking-peer-to-peer-transfers.schema";
export * from "./banking-customer-kyc.schema";
export * from "./banking-customer-addresses.schema";
export * from "./banking-customer-kyc-rail-approvals.schema";
export * from "./banking-offramp-outbox.schema";
export * from "./banking-provider-transfer-mappings.schema";
export * from "./banking-limits.schema";
export * from "./communication-codes.schema";
export * from "./polling-jobs.schema";
export * from "./in-app-notification.schema";

export const schema = {
  ...userSchema,
  ...dbPingerSchema,

  ...authSessionsSchema,
  ...authAccountsSchema,
  ...authVerificationsSchema,
  ...authSignatureChallengesSchema,
  ...challengesSchema,
  ...devicesSchema,
  ...cardControlsSchema,
  ...pushNotificationSchema,
  ...bankingEnumsSchema,
  ...bankingVirtualAccountsSchema,
  ...bankingExternalAccountsSchema,
  ...bankingCryptoContactsSchema,
  ...bankingCardsSchema,
  ...bankingCardOrdersSchema,
  ...bankingTransactionsSchema,
  ...bankingPayRequestsSchema,
  ...bankingLedgerAccountsSchema,
  ...bankingLedgerEntriesSchema,
  ...bankingLedgerHoldsSchema,
  ...bankingWalletsSchema,
  ...bankingWalletSessionsSchema,
  ...bankingKycEventsSchema,
  ...bankingOutgoingPayoutsSchema,
  ...bankingPeerToPeerTransfersSchema,
  ...bankingCustomerKycSchema,
  ...bankingCustomerAddressesSchema,
  ...bankingCustomerKycRailApprovalsSchema,
  ...bankingOfframpOutboxSchema,
  ...bankingProviderTransferMappingsSchema,
  ...bankingLimitsSchema,
  ...communicationCodesSchema,
  ...pollingJobsSchema,
  ...inAppNotificationSchema,
};
