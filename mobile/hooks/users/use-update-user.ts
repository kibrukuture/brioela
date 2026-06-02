import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setSchnlTag, updatePrivacy } from '@/services/api/users/users.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useSetSchnlTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setSchnlTag,
    onSuccess: (updatedUser) => {
      // Invalidate current user query to refresh UI
      queryClient.setQueryData(QUERY_KEYS.USER.CURRENT, updatedUser);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.CURRENT });
    },
  });
};

export const useUpdatePrivacy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrivacy,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(QUERY_KEYS.USER.CURRENT, updatedUser);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.CURRENT });
    },
  });
};
