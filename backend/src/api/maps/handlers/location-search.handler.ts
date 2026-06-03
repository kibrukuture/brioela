import type { AppContext } from '@/index';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import {
	locationSearchRequestSchema,
	locationSearchResponseSchema,
	type LocationSearchResponse,
} from '@brioela/shared/validators/location-search.validator';
import { locationSearch as locationSearchClient } from '@/core/clients/maps/client';

export async function locationSearch(c: AppContext): Promise<LocationSearchResponse> {
	const queryParam = c.req.query('query') ?? '';
	const limitParam = c.req.query('limit');
	const countryCodesParam = c.req.query('countryCodes');

	const limit = typeof limitParam === 'string' ? Number.parseInt(limitParam, 10) : undefined;
	const countryCodes =
		typeof countryCodesParam === 'string' && countryCodesParam.length > 0
			? countryCodesParam
					.split(',')
					.map((v) => v.trim())
					.filter(Boolean)
			: undefined;

	const validation = locationSearchRequestSchema.safeParse({
		query: queryParam,
		limit: Number.isNaN(limit) ? undefined : limit,
		countryCodes,
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: validation.error.issues[0].message });
	}

	const response = await locationSearchClient(validation.data);

	const outValidation = locationSearchResponseSchema.safeParse(response);
	if (!outValidation.success) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: outValidation.error.issues[0].message });
	}

	return outValidation.data;
}
