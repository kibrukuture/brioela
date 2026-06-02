import { useMutation } from '@tanstack/react-query';
import { deleteUser } from '@/services/api/users/users.api';

export const useDeleteUser = () => {
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
  });
};
