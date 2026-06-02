import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBankingRecipient } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { CreateBankingRecipientInput } from '@schnl/shared/validators/banking-recipient.validator';

export function useCreateRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBankingRecipientInput) => createBankingRecipient(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.RECIPIENTS });
    },
  });
}
