import { API_ROUTES } from '@schnl/shared/api';
import {
  KycLinkResponse,
  CreateVirtualAccountInput,
  CreateVirtualAccountResponse,
  ListVirtualAccountsResponse,
  RemoveVirtualAccountInput,
  RemoveVirtualAccountResponse,
  ActivateWalletInput,
  ActivateWalletResponse,
  SessionConfigResponse,
  SessionStatusResponse,
  RegisterSessionInput,
  RegisterSessionResponse,
  EmbeddedWalletResponse,
} from '@schnl/shared/validators/banking.validator';
import type {
  CreatePayRequestByEmailInput,
  CreatePayRequestByEmailResponse,
  ClaimPayRequestInput,
  ClaimPayRequestResponse,
  GetPayRequestResponse,
  CancelPayRequestResponse,
  SubmitPayRequestPayoutDetailsInput,
  SubmitPayRequestPayoutDetailsResponse,
} from '@schnl/shared/validators/pay-request.validator';
import { CreateActivationChallengeResponse } from '@schnl/shared/validators/challenge.validator';
import type {
  CreateOutgoingPayoutInput,
  CreateOutgoingPayoutResponse,
} from '@schnl/shared/validators/outgoing-payout.validator';
import type {
  CreatePeerToPeerTransferInput,
  CreatePeerToPeerTransferResponse,
} from '@schnl/shared/validators/peer-to-peer-transfer.validator';
import type {
  PeerToPeerPrecheckInput,
  PeerToPeerPrecheckResponse,
} from '@schnl/shared/validators/peer-to-peer-precheck.validator';
import type {
  OutgoingPayoutPrecheckInput,
  OutgoingPayoutPrecheckResponse,
} from '@schnl/shared/validators/outgoing-payout-precheck.validator';
import type {
  PayRequestPayoutPrecheckInput,
  PayRequestPayoutPrecheckResponse,
} from '@schnl/shared/validators/pay-request-precheck.validator';
import type { ListBankingTransactionsResponse } from '@schnl/shared/validators/banking-transaction.validator';
import type {
  SetBankingTransactionCategoryInput,
  SetBankingTransactionCategoryResponse,
} from '@schnl/shared/validators/banking-transaction-category-api.validator';
import type {
  SetBankingTransactionNoteInput,
  SetBankingTransactionNoteResponse,
} from '@schnl/shared/validators/banking-transaction-note-api.validator';
import type {
  UploadBankingTransactionAttachmentResponse,
  DeleteBankingTransactionAttachmentResponse,
  EmailBankingTransactionReceiptResponse,
} from '@schnl/shared/validators/banking-transaction-attachment-api.validator';
import type {
  ListBankingRecipientsResponse,
  GetBankingRecipientResponse,
  CreateBankingRecipientInput,
  CreateBankingRecipientResponse,
  DeleteBankingRecipientResponse,
} from '@schnl/shared/validators/banking-recipient.validator';
import type { ListBankingBalancesResponse } from '@schnl/shared/validators/banking-balance.validator';
import type {
  GetBankingLimitsResponse,
  UpdateBankingLimitInput,
  UpdateBankingLimitResponse,
} from '@schnl/shared/validators/banking-limit.validator';
import type { GetBankingFxRateResponse } from '@schnl/shared/validators/banking-fx-rate.validator';
import type { CustomerAddressResponse } from '@schnl/shared/validators/customer-address.validator';
import * as api from '@/services/api';

export async function getKycLink() {
  return api.get<KycLinkResponse>(API_ROUTES.banking.kycLink());
}

export async function getCustomerAddress() {
  return api.get<CustomerAddressResponse>(API_ROUTES.banking.customerAddress());
}

export async function getBankingLimits() {
  return api.get<GetBankingLimitsResponse>(API_ROUTES.banking.limits());
}

export async function updateBankingLimit(input: UpdateBankingLimitInput) {
  return api.put<UpdateBankingLimitResponse>(API_ROUTES.banking.limits(), input);
}

export async function createVirtualAccount(input: CreateVirtualAccountInput) {
  return api.post<CreateVirtualAccountResponse>(API_ROUTES.banking.virtualAccounts(), input);
}

export async function getVirtualAccounts() {
  return api.get<ListVirtualAccountsResponse>(API_ROUTES.banking.virtualAccounts());
}

export async function getBankingTransactions(params?: { limit?: number; cursor?: string }) {
  return api.get<ListBankingTransactionsResponse>(API_ROUTES.banking.transactions(), params);
}

export async function getBankingRecipients() {
  return api.get<ListBankingRecipientsResponse>(API_ROUTES.banking.recipients());
}

export async function getBankingRecipient(id: string) {
  return api.get<GetBankingRecipientResponse>(API_ROUTES.banking.recipientById(id));
}

export async function createBankingRecipient(input: CreateBankingRecipientInput) {
  return api.post<CreateBankingRecipientResponse>(API_ROUTES.banking.recipients(), input);
}

export async function deleteBankingRecipient(id: string) {
  return api.del<DeleteBankingRecipientResponse>(API_ROUTES.banking.recipientById(id));
}

export async function getBankingBalances() {
  return api.get<ListBankingBalancesResponse>(API_ROUTES.banking.balances());
}

export async function getBankingFxRate(params: { from: string; to: string }) {
  return api.get<GetBankingFxRateResponse>(API_ROUTES.banking.fxRate(), params);
}

export async function removeVirtualAccount(input: RemoveVirtualAccountInput) {
  return api.del<RemoveVirtualAccountResponse>(API_ROUTES.banking.virtualAccounts(), {
    body: input,
  });
}

export async function activateWallet(input: ActivateWalletInput) {
  return api.post<ActivateWalletResponse>(API_ROUTES.banking.activate(), input);
}

export async function createActivationChallenge(input: { walletAddress: string }) {
  return api.post<CreateActivationChallengeResponse>(API_ROUTES.banking.activateChallenge(), input);
}

export async function getSessionConfig() {
  return api.get<SessionConfigResponse>(API_ROUTES.banking.sessionConfig());
}

export async function getSessionStatus() {
  return api.get<SessionStatusResponse>(API_ROUTES.banking.sessionStatus());
}

export async function registerSession(input: RegisterSessionInput) {
  return api.post<RegisterSessionResponse>(API_ROUTES.banking.sessionRegister(), input);
}

export async function getEmbeddedWallet() {
  return api.get<EmbeddedWalletResponse>(API_ROUTES.banking.embeddedWallet());
}

export async function createPayRequestByEmail(input: CreatePayRequestByEmailInput) {
  return api.post<CreatePayRequestByEmailResponse>(API_ROUTES.banking.payRequestsByEmail(), input);
}

export async function claimPayRequest(input: ClaimPayRequestInput) {
  return api.post<ClaimPayRequestResponse>(API_ROUTES.banking.payRequestClaim(), input);
}

export async function getPayRequest(id: string) {
  return api.get<GetPayRequestResponse>(API_ROUTES.banking.payRequestById(id));
}

export async function cancelPayRequest(id: string) {
  return api.post<CancelPayRequestResponse>(API_ROUTES.banking.payRequestCancel(id));
}

export async function submitPayRequestPayoutDetails(
  id: string,
  input: SubmitPayRequestPayoutDetailsInput
) {
  return api.post<SubmitPayRequestPayoutDetailsResponse>(
    API_ROUTES.banking.payRequestPayoutDetails(id),
    input
  );
}

export async function createOutgoingPayout(input: CreateOutgoingPayoutInput) {
  return api.post<CreateOutgoingPayoutResponse>(API_ROUTES.banking.outgoingPayouts(), input);
}

export async function createPeerToPeerTransfer(input: CreatePeerToPeerTransferInput) {
  return api.post<CreatePeerToPeerTransferResponse>(
    API_ROUTES.banking.peerToPeerTransfers(),
    input
  );
}

export async function precheckPeerToPeerTransfer(input: PeerToPeerPrecheckInput) {
  return api.post<PeerToPeerPrecheckResponse>(
    API_ROUTES.banking.peerToPeerTransfersPrecheck(),
    input
  );
}

export async function precheckOutgoingPayout(input: OutgoingPayoutPrecheckInput) {
  return api.post<OutgoingPayoutPrecheckResponse>(
    API_ROUTES.banking.outgoingPayoutPrecheck(),
    input
  );
}

export async function precheckPayRequestPayout(id: string, input: PayRequestPayoutPrecheckInput) {
  return api.post<PayRequestPayoutPrecheckResponse>(
    API_ROUTES.banking.payRequestPayoutPrecheck(id),
    input
  );
}

export async function generateBankStatement(startDate: string, endDate: string) {
  return api.getBlob(API_ROUTES.banking.bankStatement(), {
    startDate,
    endDate,
  });
}

export async function setBankingTransactionCategory(
  id: string,
  input: SetBankingTransactionCategoryInput
) {
  return api.post<SetBankingTransactionCategoryResponse>(
    API_ROUTES.banking.transactionCategoryById(id),
    input
  );
}

export async function setBankingTransactionNote(id: string, input: SetBankingTransactionNoteInput) {
  return api.post<SetBankingTransactionNoteResponse>(
    API_ROUTES.banking.transactionNoteById(id),
    input
  );
}

export async function uploadBankingTransactionAttachment(id: string, payload: FormData) {
  return api.post<UploadBankingTransactionAttachmentResponse>(
    API_ROUTES.banking.transactionAttachmentsById(id),
    payload
  );
}

export async function deleteBankingTransactionAttachment(id: string, attachmentId: string) {
  return api.del<DeleteBankingTransactionAttachmentResponse>(
    API_ROUTES.banking.transactionAttachmentById(id, attachmentId)
  );
}

export async function getBankingTransactionReceipt(id: string) {
  return api.getBlob(API_ROUTES.banking.transactionReceiptById(id));
}

export async function emailBankingTransactionReceipt(id: string) {
  return api.post<EmailBankingTransactionReceiptResponse>(
    API_ROUTES.banking.transactionReceiptEmailById(id)
  );
}
