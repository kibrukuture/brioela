import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBankingTransactionAttachment } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

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
