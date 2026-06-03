import { useQuery } from '@tanstack/react-query';
import { listInAppNotifications } from '@/network/in-app-notifications/in-app-notifications.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export const useInAppNotifications = () => {
  return useQuery({
    queryKey: QUERY_KEYS.IN_APP_NOTIFICATIONS.LIST,
    queryFn: listInAppNotifications,
  });
};
