import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/network/core/query-keys';
import { searchUsers } from '@/network/users/users.api';
import type { UserSearchRequest } from '@brioela/shared/validators/user-search.validator';

export function useSearchUsers(request: UserSearchRequest) {
  return useQuery({
    queryKey: QUERY_KEYS.USER.SEARCH(request.query),
    queryFn: () => searchUsers(request),
    enabled: request.query.length > 0,
  });
}
