import { useMutation } from '@tanstack/react-query';
import type {
  PayRequestPayoutPrecheckInput,
  PayRequestPayoutPrecheckResponse,
} from '@brioela/shared/validators/pay-request-precheck.validator';
import { precheckPayRequestPayout } from '@/services/api/banking/banking.api';

type Variables = { id: string; input: PayRequestPayoutPrecheckInput };

export function usePrecheckPayRequestPayout() {
  return useMutation<PayRequestPayoutPrecheckResponse, Error, Variables>({
    mutationFn: ({ id, input }) => precheckPayRequestPayout(id, input),
  });
}
