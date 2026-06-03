import { AppContext } from '@/index';
import { apiSuccessResponse } from '@/lib/response';
import * as service from '@/api/card-controls/card-controls.service';

export async function onGetCardControls(c: AppContext) {
	const controls = await service.getCardControls(c);
	return c.json(apiSuccessResponse(controls));
}

export async function onUpdateCardControls(c: AppContext) {
	const controls = await service.updateCardControls(c);
	return c.json(apiSuccessResponse(controls));
}
