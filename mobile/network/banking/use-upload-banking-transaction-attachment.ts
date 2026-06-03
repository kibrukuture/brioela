import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadBankingTransactionAttachment } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useUploadBankingTransactionAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData }) =>
      uploadBankingTransactionAttachment(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.TRANSACTIONS_BASE });
    },
  });
}
