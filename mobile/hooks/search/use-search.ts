import { useQuery } from '@tanstack/react-query';
import { searchUsers } from '@/services/api/users/users.api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { UserSearchRequest } from '@brioela/shared/validators/user-search.validator';

export function useSearch(request: UserSearchRequest) {
  return useQuery({
    queryKey: QUERY_KEYS.USER.SEARCH(request.query),
    queryFn: () => searchUsers(request),
    enabled: request.query.length > 0, // Only run query if there's a search term
  });
}
