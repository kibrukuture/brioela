import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBankingRecipient } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';
import type { CreateBankingRecipientInput } from '@brioela/shared/validators/banking-recipient.validator';

export function useCreateRecipient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBankingRecipientInput) => createBankingRecipient(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.RECIPIENTS });
    },
  });
}
