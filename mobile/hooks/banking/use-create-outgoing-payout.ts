import { useMutation } from '@tanstack/react-query';
import type {
  CreateOutgoingPayoutInput,
  CreateOutgoingPayoutResponse,
} from '@schnl/shared/validators/outgoing-payout.validator';
import { createOutgoingPayout } from '@/services/api/banking/banking.api';

export function useCreateOutgoingPayout() {
  return useMutation<CreateOutgoingPayoutResponse, Error, CreateOutgoingPayoutInput>({
    mutationFn: (input) => createOutgoingPayout(input),
  });
}
