import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { connectInAppNotificationsWs } from '@/services/ws/in-app-notifications/connect-in-app-notifications-ws';

export const useInAppNotificationsWebsocket = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = connectInAppNotificationsWs({
      onEvent: async () => {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IN_APP_NOTIFICATIONS.LIST });
      },
    });

    ws.connect().catch(() => {});

    return () => {
      ws.disconnect();
    };
  }, [queryClient]);
};
