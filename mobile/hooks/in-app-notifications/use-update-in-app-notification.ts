import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateInAppNotification } from '@/services/api/in-app-notifications/in-app-notifications.api';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { UpdateInAppNotificationInput } from '@schnl/shared/validators/in-app-notification.validator';

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
