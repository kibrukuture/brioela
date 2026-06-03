import { AppContext } from '@/index';
import * as handlers from '@/api/communication-codes/handlers';
import { apiSuccessResponse } from '@/lib/response';

export async function onUpdateCommunicationCode(c: AppContext) {
	const result = await handlers.updateCommunicationCode(c);
	return c.json(apiSuccessResponse(result));
}

export async function onGetCommunicationCode(c: AppContext) {
	const result = await handlers.getCommunicationCode(c);
	return c.json(apiSuccessResponse(result));
}
