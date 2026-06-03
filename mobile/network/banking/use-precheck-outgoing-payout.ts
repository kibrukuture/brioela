import { useMutation } from '@tanstack/react-query';
import type {
  OutgoingPayoutPrecheckInput,
  OutgoingPayoutPrecheckResponse,
} from '@brioela/shared/validators/outgoing-payout-precheck.validator';
import { precheckOutgoingPayout } from '@/network/banking/banking.api';

export function usePrecheckOutgoingPayout() {
  return useMutation<OutgoingPayoutPrecheckResponse, Error, OutgoingPayoutPrecheckInput>({
    mutationFn: (input) => precheckOutgoingPayout(input),
  });
}
