import { API_ROUTES } from '@schnl/shared/api';
import type {
  LocationSearchRequest,
  LocationSearchResponse,
} from '@schnl/shared/validators/location-search.validator';
import * as api from '@/services/api';

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
