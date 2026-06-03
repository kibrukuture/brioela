import type { AppContext } from '@/index';
import { apiSuccessResponse } from '@/lib/response';
import * as handlers from '@/api/payments/stripe/handlers';

export async function createBillingPortalSession(c: AppContext) {
	const result = await handlers.createBillingPortalSession(c);
	return c.json(apiSuccessResponse(result));
}

export async function createTopupIntent(c: AppContext) {
	const result = await handlers.createTopupIntent(c);
	return c.json(apiSuccessResponse(result));
}
