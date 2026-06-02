import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadBankingTransactionAttachment } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

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
