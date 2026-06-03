import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/network/core/query-keys';
import { connectInAppNotificationsWs } from '@/network/in-app-notifications/connect-in-app-notifications-ws';

export const useInAppNotificationsWebsocket = () => {
  const queryClient = useQueryClient();

  useIsomorphicLayoutEffect(() => {
    const ws = connectInAppNotificationsWs({
      onEvent: async () => {
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.IN_APP_NOTIFICATIONS.LIST });
      } });

    ws.connect().catch(() => {} );

    return () => {
      ws.disconnect();
    };
  }, [queryClient]);
};
