import { useMutation } from '@tanstack/react-query';
import type {
  ClaimPayRequestInput,
  ClaimPayRequestResponse,
} from '@brioela/shared/validators/pay-request.validator';
import { claimPayRequest } from '@/services/api/banking/banking.api';

export function useClaimPayRequest() {
  return useMutation<ClaimPayRequestResponse, Error, ClaimPayRequestInput>({
    mutationFn: (input) => claimPayRequest(input),
  });
}
