import type { AppContext } from '@/index';
import { apiSuccessResponse } from '@/lib/response';
import { registerPushToken, unregisterPushToken } from '@/api/notifications/push.service';

export async function onRegister(c: AppContext) {
	const result = await registerPushToken(c);
	return c.json(apiSuccessResponse(result));
}

export async function onUnregister(c: AppContext) {
	const result = await unregisterPushToken(c);
	return c.json(apiSuccessResponse(result));
}
