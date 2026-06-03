import { API_ROUTES } from '@brioela/shared/api';
import type {
  LocationSearchRequest,
  LocationSearchResponse,
} from '@brioela/shared/validators/location-search.validator';
import * as api from '@/network/core';

export async function locationSearch(
  request: LocationSearchRequest
): Promise<LocationSearchResponse> {
  const params: Record<string, unknown> = {
    query: request.query,
    limit: request.limit,
  };

  if (Array.isArray(request.countryCodes) && request.countryCodes.length > 0) {
    params.countryCodes = request.countryCodes.join(',');
  }

  return api.get<LocationSearchResponse>(API_ROUTES.maps.locationSearch(), params);
}
