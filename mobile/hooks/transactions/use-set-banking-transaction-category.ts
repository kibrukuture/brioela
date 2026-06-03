import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setBankingTransactionCategory } from '@/services/api/banking/banking.api';
import type { SetBankingTransactionCategoryInput } from '@brioela/shared/validators/banking-transaction-category-api.validator';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useSetBankingTransactionCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetBankingTransactionCategoryInput }) =>
      setBankingTransactionCategory(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.TRANSACTIONS_BASE });
    },
  });
}
