import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createVirtualAccount } from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';
import type { CreateVirtualAccountInput } from '@brioela/shared/validators/banking.validator';

export function useCreateVirtualAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateVirtualAccountInput) => createVirtualAccount(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.ACCOUNTS });
    },
  });
}
