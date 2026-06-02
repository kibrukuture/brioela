import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { updateProfilePicture } from '@/services/api/users/users.api';

export function useUpdateProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      return updateProfilePicture(formData);
    },
    onSuccess: () => {
      // We only get { profilePicture } back from this endpoint, so refetch the full user
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.CURRENT });
    },
  });
}
