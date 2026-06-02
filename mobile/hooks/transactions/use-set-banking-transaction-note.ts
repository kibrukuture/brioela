import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setBankingTransactionNote } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { SetBankingTransactionNoteInput } from '@schnl/shared/validators/banking-transaction-note-api.validator';

export function useSetBankingTransactionNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetBankingTransactionNoteInput }) =>
      setBankingTransactionNote(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.TRANSACTIONS_BASE });
    },
  });
}
