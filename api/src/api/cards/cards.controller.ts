import { AppContext } from '@/index';
import { apiSuccessResponse } from '@/lib/response';
import * as handlers from '@/api/cards/handlers';

export async function onListCards(c: AppContext) {
	const result = await handlers.listCards(c);
	return c.json(apiSuccessResponse(result));
}

export async function onCreateCardOrder(c: AppContext) {
	const result = await handlers.createCardOrder(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetCardOrder(c: AppContext) {
	const result = await handlers.getCardOrder(c);
	return c.json(apiSuccessResponse(result));
}

export async function onFreezeCard(c: AppContext) {
	const result = await handlers.freezeCard(c);
	return c.json(apiSuccessResponse(result));
}

export async function onUnfreezeCard(c: AppContext) {
	const result = await handlers.unfreezeCard(c);
	return c.json(apiSuccessResponse(result));
}

export async function onCancelCard(c: AppContext) {
	const result = await handlers.cancelCard(c);
	return c.json(apiSuccessResponse(result));
}

export async function onSetCardLabel(c: AppContext) {
	const result = await handlers.setCardLabel(c);
	return c.json(apiSuccessResponse(result));
}

export async function onUpdateCardSpendingLimits(c: AppContext) {
	const result = await handlers.updateCardSpendingLimits(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetCardSpendingLimits(c: AppContext) {
	const result = await handlers.getCardSpendingLimits(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetAppleWalletProvisioning(c: AppContext) {
	const result = await handlers.getAppleWalletProvisioning(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetGooglePayProvisioning(c: AppContext) {
	const result = await handlers.getGooglePayProvisioning(c);
	return c.json(apiSuccessResponse(result));
}
