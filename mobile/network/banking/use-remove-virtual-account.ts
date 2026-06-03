import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  RemoveVirtualAccountInput,
  RemoveVirtualAccountResponse,
} from '@brioela/shared/validators/banking.validator';
import * as bankingApi from '@/network/banking/banking.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useRemoveVirtualAccount() {
  const queryClient = useQueryClient();
  return useMutation<RemoveVirtualAccountResponse, Error, RemoveVirtualAccountInput>({
    mutationFn: (input) => bankingApi.removeVirtualAccount(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.ACCOUNTS });
    },
  });
}
