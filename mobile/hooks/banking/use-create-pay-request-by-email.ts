import { useMutation } from '@tanstack/react-query';
import type {
  CreatePayRequestByEmailInput,
  CreatePayRequestByEmailResponse,
} from '@brioela/shared/validators/pay-request.validator';
import { createPayRequestByEmail } from '@/services/api/banking/banking.api';

export function useCreatePayRequestByEmail() {
  return useMutation<CreatePayRequestByEmailResponse, Error, CreatePayRequestByEmailInput>({
    mutationFn: (input) => createPayRequestByEmail(input),
  });
}
