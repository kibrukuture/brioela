import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import {
	locationSearchResponseSchema,
	type LocationSearchRequest,
	type LocationSearchResponse,
} from '@schnl/shared/validators/location-search.validator';

type LocationIqAutocompleteRow = {
	place_id?: string;
	display_name?: string;
	lat?: string;
	lon?: string;
	address?: Record<string, unknown>;
};

export async function locationSearch(input: LocationSearchRequest): Promise<LocationSearchResponse> {
	const token = process.env.LOCATION_IQ_ACCESS_TOKEN;
	if (!token) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: 'LOCATION_IQ_ACCESS_TOKEN is not configured',
		});
	}

	const url = new URL('https://api.locationiq.com/v1/autocomplete');
	url.searchParams.set('key', token);
	url.searchParams.set('q', input.query);
	url.searchParams.set('format', 'json');
	url.searchParams.set('addressdetails', '1');
	url.searchParams.set('normalizeaddress', '1');
	url.searchParams.set('limit', String(input.limit ?? 10));

	if (Array.isArray(input.countryCodes) && input.countryCodes.length > 0) {
		url.searchParams.set('countrycodes', input.countryCodes.join(','));
	}

	const res = await fetch(url.toString(), {
		method: 'GET',
		headers: {
			Accept: 'application/json',
		},
	});

	if (!res.ok) {
		const text = await res.text();
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, {
			message: `LocationIQ autocomplete failed: ${res.status} ${res.statusText}: ${text}`,
		});
	}

	const raw = (await res.json()) as unknown;
	if (!Array.isArray(raw)) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, {
			message: 'Invalid LocationIQ response: expected array',
		});
	}

	const results = (raw as LocationIqAutocompleteRow[]).map((row) => {
		return {
			placeId: typeof row.place_id === 'string' ? row.place_id : '',
			displayName: typeof row.display_name === 'string' ? row.display_name : '',
			lat: typeof row.lat === 'string' ? row.lat : '',
			lon: typeof row.lon === 'string' ? row.lon : '',
			address: row.address && typeof row.address === 'object' ? (row.address as any) : null,
		};
	});

	const validation = locationSearchResponseSchema.safeParse({ results });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, {
			message: validation.error.issues[0].message,
		});
	}

	return validation.data;
}
