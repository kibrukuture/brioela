import { useMutation } from '@tanstack/react-query';
import { postLabWork, PostLabWork } from '@/services/api/lab-work/lab-work.api';

export const usePostLabWork = () => {
  return useMutation({
    mutationFn: (payload: PostLabWork) => postLabWork(payload),
  });
};
