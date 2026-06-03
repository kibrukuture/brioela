import { AppContext } from '@/index';
import * as service from '@/api/devices/devices.service';
import { apiSuccessResponse } from '@/lib/response';

export async function onBindDevice(c: AppContext) {
	const device = await service.bindDevice(c);
	return c.json(apiSuccessResponse(device));
}

export async function onVerifyDevice(c: AppContext) {
	const result = await service.verifyDevice(c);
	return c.json(apiSuccessResponse(result));
}

export async function onUnbindDevice(c: AppContext) {
	const result = await service.unbindDevice(c);
	return c.json(apiSuccessResponse(result));
}
