import { useMutation, useQueryClient } from '@tanstack/react-query';
import { kycLegalNameAndWallet } from '@/network/users/users.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useKycLegalNameAndWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: kycLegalNameAndWallet,
    onSuccess: (updatedUser) => {
      // Update the user in the cache immediately
      queryClient.setQueryData(QUERY_KEYS.USER.CURRENT, updatedUser);
    },
  });
};
