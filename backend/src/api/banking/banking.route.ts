import { Hono } from 'hono';
import * as controller from '@/api/banking/banking.controller';
import { API_ROUTE_PATTERNS } from '@schnl/shared/api';

const bankingRouter = new Hono();

bankingRouter.get(API_ROUTE_PATTERNS.banking.kycLink, controller.onGetKycLink);
bankingRouter.get(API_ROUTE_PATTERNS.banking.customerAddress, controller.onGetCustomerAddress);
bankingRouter.get(API_ROUTE_PATTERNS.banking.limits, controller.onGetBankingLimits);
bankingRouter.put(API_ROUTE_PATTERNS.banking.limits, controller.onUpdateBankingLimit);
bankingRouter.get(API_ROUTE_PATTERNS.banking.virtualAccounts, controller.onGetVirtualAccounts);
bankingRouter.post(API_ROUTE_PATTERNS.banking.virtualAccounts, controller.onCreateVirtualAccount);
bankingRouter.delete(API_ROUTE_PATTERNS.banking.virtualAccounts, controller.onRemoveVirtualAccount);
bankingRouter.get(API_ROUTE_PATTERNS.banking.transactions, controller.onListBankingTransactions);
bankingRouter.get(API_ROUTE_PATTERNS.banking.recipients, controller.onListBankingRecipients);
bankingRouter.post(API_ROUTE_PATTERNS.banking.recipients, controller.onCreateBankingRecipient);
bankingRouter.get(API_ROUTE_PATTERNS.banking.recipientById, controller.onGetBankingRecipient);
bankingRouter.delete(API_ROUTE_PATTERNS.banking.recipientById, controller.onDeleteBankingRecipient);
bankingRouter.get(API_ROUTE_PATTERNS.banking.balances, controller.onListBankingBalances);
bankingRouter.get(API_ROUTE_PATTERNS.banking.fxRate, controller.onGetBankingFxRate);
bankingRouter.post(API_ROUTE_PATTERNS.banking.payRequestsByEmail, controller.onCreatePayRequestByEmail);
bankingRouter.post(API_ROUTE_PATTERNS.banking.payRequestClaim, controller.onClaimPayRequest);
bankingRouter.get(API_ROUTE_PATTERNS.banking.payRequestById, controller.onGetPayRequest);
bankingRouter.post(API_ROUTE_PATTERNS.banking.payRequestCancel, controller.onCancelPayRequest);
bankingRouter.post(API_ROUTE_PATTERNS.banking.payRequestPayoutDetails, controller.onSubmitPayRequestPayoutDetails);
bankingRouter.post(API_ROUTE_PATTERNS.banking.payRequestPayoutPrecheck, controller.onPrecheckPayRequestPayout);
bankingRouter.post(API_ROUTE_PATTERNS.banking.outgoingPayouts, controller.onCreateOutgoingPayout);
bankingRouter.post(API_ROUTE_PATTERNS.banking.outgoingPayoutPrecheck, controller.onPrecheckOutgoingPayout);
bankingRouter.post(API_ROUTE_PATTERNS.banking.peerToPeerTransfers, controller.onCreatePeerToPeerTransfer);
bankingRouter.post(API_ROUTE_PATTERNS.banking.peerToPeerTransfersPrecheck, controller.onPrecheckPeerToPeerTransfer);
bankingRouter.post(API_ROUTE_PATTERNS.banking.activateChallenge, controller.onCreateActivationChallenge);
bankingRouter.post(API_ROUTE_PATTERNS.banking.activate, controller.onActivateWallet);
bankingRouter.get(API_ROUTE_PATTERNS.banking.embeddedWallet, controller.onGetEmbeddedWallet);
bankingRouter.get(API_ROUTE_PATTERNS.banking.sessionConfig, controller.onGetSessionConfig);
bankingRouter.get(API_ROUTE_PATTERNS.banking.sessionStatus, controller.onGetSessionStatus);
bankingRouter.post(API_ROUTE_PATTERNS.banking.sessionRegister, controller.onRegisterSession);
bankingRouter.post(API_ROUTE_PATTERNS.banking.sessionTestTx, controller.onTestDelegatedTx);
bankingRouter.get(API_ROUTE_PATTERNS.banking.bankStatement, controller.onGenerateStatement);

bankingRouter.post(API_ROUTE_PATTERNS.banking.transactionCategoryById, controller.onSetBankingTransactionCategory);
bankingRouter.post(API_ROUTE_PATTERNS.banking.transactionNoteById, controller.onSetBankingTransactionNote);
bankingRouter.post(API_ROUTE_PATTERNS.banking.transactionAttachmentsById, controller.onUploadBankingTransactionAttachment);
bankingRouter.delete(API_ROUTE_PATTERNS.banking.transactionAttachmentById, controller.onDeleteBankingTransactionAttachment);
bankingRouter.get(API_ROUTE_PATTERNS.banking.transactionReceiptById, controller.onGetBankingTransactionReceipt);
bankingRouter.post(API_ROUTE_PATTERNS.banking.transactionReceiptEmailById, controller.onEmailBankingTransactionReceipt);

export default bankingRouter;
