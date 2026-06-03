import type { AppContext } from '@/index';
import { apiSuccessResponse, apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@brioela/shared/types/api';
import Courier from '@trycourier/courier';

export async function onMintJwt(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) {
		return c.json(apiErrorResponse(ErrorCode.UNAUTHORIZED, 'Unauthorized'), 401);
	}
	const authKey = process.env.COURIER_AUTH_KEY;
	if (!authKey) {
		return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'COURIER_AUTH_KEY is not configured'), 500);
	}
	const scope = `user_id:${user.id} write:user-tokens inbox:read:messages inbox:write:events read:preferences write:preferences read:brands`;

	const client = new Courier({ apiKey: authKey });
	const response = await client.auth.issueToken({ scope, expires_in: '7 days' });
	const token = response.token ?? '';
	if (token.length === 0) {
		return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Invalid Courier token response'), 502);
	}
	return c.json(apiSuccessResponse({ token }));
}
