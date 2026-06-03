import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activateWallet } from '@/services/api/banking/banking.api';
import {
  ActivateWalletInput,
  ActivateWalletResponse,
} from '@brioela/shared/validators/banking.validator';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useActivateWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<ActivateWalletResponse, Error, ActivateWalletInput>({
    mutationFn: activateWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANKING.ACCOUNTS });
    },
  });
};
