import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CancelPayRequestResponse } from '@brioela/shared/validators/pay-request.validator';
import { cancelPayRequest } from '@/services/api/banking/banking.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useCancelPayRequest() {
  const queryClient = useQueryClient();

  return useMutation<CancelPayRequestResponse, Error, { id: string }>({
    mutationFn: ({ id }) => cancelPayRequest(id),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.TRANSACTIONS_BASE });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BANKING.PAY_REQUEST(variables.id),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.BANKING.BALANCES,
      });
    },
  });
}
