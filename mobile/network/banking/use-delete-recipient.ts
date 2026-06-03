import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBankingRecipient } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useDeleteRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBankingRecipient(id),
    onSuccess: async (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.RECIPIENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.RECIPIENT_BY_ID(id) });
    },
  });
}
