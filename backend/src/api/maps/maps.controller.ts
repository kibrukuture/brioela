import { AppContext } from '@/index';
import { apiSuccessResponse } from '@/lib/response';
import * as handlers from '@/api/maps/handlers';

export async function onLocationSearch(c: AppContext) {
	const result = await handlers.locationSearch(c);
	return c.json(apiSuccessResponse(result));
}
