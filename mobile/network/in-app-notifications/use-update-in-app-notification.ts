import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInAppNotification } from '@/network/in-app-notifications/in-app-notifications.api';
import { QUERY_KEYS } from '@/network/core/query-keys';
import type { UpdateInAppNotificationInput } from '@brioela/shared/validators/in-app-notification.validator';

export const useUpdateInAppNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: { id: string; input: UpdateInAppNotificationInput }) => {
      return updateInAppNotification(args.id, args.input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IN_APP_NOTIFICATIONS.LIST });
    },
  });
};
