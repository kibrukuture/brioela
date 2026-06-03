import { AppContext } from '@/index';
import * as handlers from '@/api/banking/handlers';
import { apiSuccessResponse } from '@/lib/response';

export async function onCreateActivationChallenge(c: AppContext) {
	const result = await handlers.createActivationChallenge(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetKycLink(c: AppContext) {
	const result = await handlers.getKycLink(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetCustomerAddress(c: AppContext) {
	const result = await handlers.getCustomerAddress(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetBankingLimits(c: AppContext) {
	const result = await handlers.getBankingLimits(c);
	return c.json(apiSuccessResponse(result));
}

export async function onUpdateBankingLimit(c: AppContext) {
	const result = await handlers.updateBankingLimit(c);
	return c.json(apiSuccessResponse(result));
}

export async function onCreateVirtualAccount(c: AppContext) {
	const result = await handlers.createVirtualAccount(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetVirtualAccounts(c: AppContext) {
	const result = await handlers.getVirtualAccounts(c);
	return c.json(apiSuccessResponse(result));
}

export async function onRemoveVirtualAccount(c: AppContext) {
	const result = await handlers.removeVirtualAccount(c);
	return c.json(apiSuccessResponse(result));
}

export async function onCreatePayRequestByEmail(c: AppContext) {
	const result = await handlers.createPayRequestByEmail(c);
	return c.json(apiSuccessResponse(result));
}

export async function onClaimPayRequest(c: AppContext) {
	const result = await handlers.claimPayRequest(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetPayRequest(c: AppContext) {
	const result = await handlers.getPayRequest(c);
	return c.json(apiSuccessResponse(result));
}

export async function onCancelPayRequest(c: AppContext) {
	const result = await handlers.cancelPayRequest(c);
	return c.json(apiSuccessResponse(result));
}

export async function onSubmitPayRequestPayoutDetails(c: AppContext) {
	const result = await handlers.submitPayRequestPayoutDetails(c);
	return c.json(apiSuccessResponse(result));
}

export async function onPrecheckPayRequestPayout(c: AppContext) {
	const result = await handlers.precheckPayRequestPayout(c);
	return c.json(apiSuccessResponse(result));
}

export async function onCreateOutgoingPayout(c: AppContext) {
	const result = await handlers.createOutgoingPayout(c);
	return c.json(apiSuccessResponse(result));
}

export async function onPrecheckOutgoingPayout(c: AppContext) {
	const result = await handlers.precheckOutgoingPayout(c);
	return c.json(apiSuccessResponse(result));
}

export async function onCreatePeerToPeerTransfer(c: AppContext) {
	const result = await handlers.createPeerToPeerTransfer(c);
	return c.json(apiSuccessResponse(result));
}

export async function onPrecheckPeerToPeerTransfer(c: AppContext) {
	const result = await handlers.precheckPeerToPeerTransfer(c);
	return c.json(apiSuccessResponse(result));
}

export async function onActivateWallet(c: AppContext) {
	const result = await handlers.activateWallet(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetSessionConfig(c: AppContext) {
	const result = await handlers.getSessionConfig(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetSessionStatus(c: AppContext) {
	const result = await handlers.getSessionStatus(c);
	return c.json(apiSuccessResponse(result));
}

export async function onRegisterSession(c: AppContext) {
	const result = await handlers.registerSession(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetEmbeddedWallet(c: AppContext) {
	const result = await handlers.getEmbeddedWallet(c);
	return c.json(apiSuccessResponse(result));
}

export async function onTestDelegatedTx(c: AppContext) {
	const result = await handlers.testDelegatedTx(c);
	return c.json(apiSuccessResponse(result));
}

export async function onListBankingTransactions(c: AppContext) {
	const result = await handlers.listBankingTransactions(c);
	return c.json(apiSuccessResponse(result));
}

export async function onListBankingRecipients(c: AppContext) {
	const result = await handlers.listBankingRecipients(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetBankingRecipient(c: AppContext) {
	const result = await handlers.getBankingRecipient(c);
	return c.json(apiSuccessResponse(result));
}

export async function onCreateBankingRecipient(c: AppContext) {
	const result = await handlers.createBankingRecipient(c);
	return c.json(apiSuccessResponse(result));
}

export async function onDeleteBankingRecipient(c: AppContext) {
	const result = await handlers.deleteBankingRecipient(c);
	return c.json(apiSuccessResponse(result));
}

export async function onListBankingBalances(c: AppContext) {
	const result = await handlers.listBankingBalances(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetBankingFxRate(c: AppContext) {
	const result = await handlers.getBankingFxRate(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGenerateStatement(c: AppContext) {
	return await handlers.generateStatement(c);
}

export async function onSetBankingTransactionCategory(c: AppContext) {
	const result = await handlers.setBankingTransactionCategory(c);
	return c.json(apiSuccessResponse(result));
}

export async function onSetBankingTransactionNote(c: AppContext) {
	const result = await handlers.setBankingTransactionNote(c);
	return c.json(apiSuccessResponse(result));
}

export async function onUploadBankingTransactionAttachment(c: AppContext) {
	const result = await handlers.uploadBankingTransactionAttachment(c);
	return c.json(apiSuccessResponse(result));
}

export async function onDeleteBankingTransactionAttachment(c: AppContext) {
	const result = await handlers.deleteBankingTransactionAttachment(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetBankingTransactionReceipt(c: AppContext) {
	return await handlers.getBankingTransactionReceipt(c);
}

export async function onEmailBankingTransactionReceipt(c: AppContext) {
	const result = await handlers.emailBankingTransactionReceipt(c);
	return c.json(apiSuccessResponse(result));
}
