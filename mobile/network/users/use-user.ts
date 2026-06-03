import { useQuery } from '@tanstack/react-query';
import { getUserById } from '@/network/users/users.api';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useUser = () => {
  const userId = useAuthStore.getState().user?.id;

  return useQuery({
    queryKey: QUERY_KEYS.USER.CURRENT,

    queryFn: () => {
      return getUserById(userId ?? '');
    },
    enabled: !!userId,
  });
};
