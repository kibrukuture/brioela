import { useMutation } from '@tanstack/react-query';
import { createActivationChallenge } from '@/services/api/banking/banking.api';
import { CreateActivationChallengeResponse } from '@brioela/shared/validators/challenge.validator';

export const useCreateActivationChallenge = () => {
  return useMutation<CreateActivationChallengeResponse, Error, { walletAddress: string }>({
    mutationFn: createActivationChallenge,
  });
};
