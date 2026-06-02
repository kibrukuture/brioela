import { useQuery } from '@tanstack/react-query';
import { listInAppNotifications } from '@/services/api/in-app-notifications/in-app-notifications.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export const useInAppNotifications = () => {
  return useQuery({
    queryKey: QUERY_KEYS.IN_APP_NOTIFICATIONS.LIST,
    queryFn: listInAppNotifications,
  });
};
