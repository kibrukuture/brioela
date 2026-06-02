import { useMutation } from '@tanstack/react-query';
import type {
  OutgoingPayoutPrecheckInput,
  OutgoingPayoutPrecheckResponse,
} from '@schnl/shared/validators/outgoing-payout-precheck.validator';
import { precheckOutgoingPayout } from '@/services/api/banking/banking.api';

export function usePrecheckOutgoingPayout() {
  return useMutation<OutgoingPayoutPrecheckResponse, Error, OutgoingPayoutPrecheckInput>({
    mutationFn: (input) => precheckOutgoingPayout(input),
  });
}
