import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBankingLimit } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useUpdateBankingLimit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBankingLimit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.LIMITS });
    },
  });
};
