import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBankingTransactionAttachment } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useDeleteBankingTransactionAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      deleteBankingTransactionAttachment(id, attachmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.TRANSACTIONS_BASE });
    },
  });
}
