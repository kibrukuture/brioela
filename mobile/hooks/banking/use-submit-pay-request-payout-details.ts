import { useMutation } from '@tanstack/react-query';
import type {
  SubmitPayRequestPayoutDetailsInput,
  SubmitPayRequestPayoutDetailsResponse,
} from '@schnl/shared/validators/pay-request.validator';
import { submitPayRequestPayoutDetails } from '@/services/api/banking/banking.api';

type Variables = { id: string; input: SubmitPayRequestPayoutDetailsInput };

export function useSubmitPayRequestPayoutDetails() {
  return useMutation<SubmitPayRequestPayoutDetailsResponse, Error, Variables>({
    mutationFn: ({ id, input }) => submitPayRequestPayoutDetails(id, input),
  });
}
