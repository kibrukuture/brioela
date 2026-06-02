import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBankingLimit } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useUpdateBankingLimit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBankingLimit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.LIMITS });
    },
  });
};
