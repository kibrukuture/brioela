import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markAllInAppNotificationsRead } from '@/network/in-app-notifications/in-app-notifications.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useMarkAllInAppNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllInAppNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IN_APP_NOTIFICATIONS.LIST });
    },
  });
};
