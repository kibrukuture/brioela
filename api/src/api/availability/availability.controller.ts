import * as availabilityHandlers from '@/api/availability/handlers';
import { AppContext } from '@/index';
import { apiSuccessResponse } from '@/lib/response';

export const onCheckSchnlTag = async (c: AppContext) => {
	const response = await availabilityHandlers.checkSchnlTagAvailability(c);
	return c.json(apiSuccessResponse(response));
};
