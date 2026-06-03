import { useMutation } from '@tanstack/react-query';
import type {
  CreateOutgoingPayoutInput,
  CreateOutgoingPayoutResponse,
} from '@brioela/shared/validators/outgoing-payout.validator';
import { createOutgoingPayout } from '@/network/banking/banking.api';

export function useCreateOutgoingPayout() {
  return useMutation<CreateOutgoingPayoutResponse, Error, CreateOutgoingPayoutInput>({
    mutationFn: (input) => createOutgoingPayout(input),
  });
}
