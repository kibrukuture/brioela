import { useQuery } from '@tanstack/react-query';
import { checkSchnlTag } from '@/network/users/users.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useCheckSchnlTag = (tag: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER.CHECK_SCHNL_TAG(tag),
    queryFn: () => checkSchnlTag(tag),
    enabled: tag.length >= 3,
    retry: false,
    staleTime: 0, // Always check fresh
  });
};
