import type { AppContext } from '@/index';
import { apiSuccessResponse, apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';

export async function pingUpstash(c: AppContext) {
	try {
		const body = await c.req.json();
		console.log('Received message from Upstash:', body);

		return c.json(apiSuccessResponse({ message: 'Received message from Upstash' }));
	} catch (error: unknown) {
		console.error('Error pinging Upstash:', error);
		return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Error pinging Upstash'), 500);
	}
}
