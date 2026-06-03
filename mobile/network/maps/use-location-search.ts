import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/network/core/query-keys';
import type { LocationSearchRequest } from '@brioela/shared/validators/location-search.validator';
import { locationSearch } from '@/network/maps/maps.api';

export function useLocationSearch(request: LocationSearchRequest) {
  return useQuery({
    queryKey: QUERY_KEYS.MAPS.LOCATION_SEARCH({
      query: request.query,
      countryCodes: request.countryCodes,
    }),
    queryFn: () => locationSearch(request),
    enabled: request.query.length > 0,
  });
}
