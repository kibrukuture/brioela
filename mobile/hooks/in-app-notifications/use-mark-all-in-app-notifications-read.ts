import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAllInAppNotificationsRead } from '@/services/api/in-app-notifications/in-app-notifications.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useMarkAllInAppNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllInAppNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IN_APP_NOTIFICATIONS.LIST });
    },
  });
};
