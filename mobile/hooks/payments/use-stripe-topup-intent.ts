import { useMutation } from '@tanstack/react-query';
import { createStripeTopupIntent } from '@/services/api/payments/stripe';
import type {
  CreateTopupIntentRequest,
  CreateTopupIntentResponse,
} from '@schnl/shared/validators/stripe.validator';

export function useStripeTopupIntent() {
  return useMutation({
    mutationFn: (input: CreateTopupIntentRequest): Promise<CreateTopupIntentResponse> =>
      createStripeTopupIntent(input),
  });
}
