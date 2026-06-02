import { API_ROUTES } from '@schnl/shared/api';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { createWsClient } from '@/services/ws/create-ws-client';
import { post } from '@/services/api';
import type { MintInAppNotificationsWsTicketResponse } from '@schnl/shared/validators/in-app-notifications-ws-ticket.validator';

type ConnectOptions = {
  onEvent: (event: unknown) => void;
};

type InAppNotificationsWsEvent = {
  type: string;
  payload?: unknown;
};

export function connectInAppNotificationsWs(options: ConnectOptions) {
  let client: ReturnType<typeof createWsClient> | null = null;

  const connect = async () => {
    const token = useAuthStore.getState().session?.access_token;
    const userId = useAuthStore.getState().user?.id;

    if (!token || !userId) return;

    const ticketResponse = await post<MintInAppNotificationsWsTicketResponse>(
      API_ROUTES.inAppNotifications.wsTicket()
    );

    client = createWsClient<InAppNotificationsWsEvent>({
      path: API_ROUTES.inAppNotifications.ws(),
      query: {
        ticket: ticketResponse.ticket,
      },
      onOpen: () => {
        client?.sendJson({ type: 'ping' });
      },
      parseMessage: (raw) => {
        if (!raw || typeof raw !== 'object') return null;
        const candidate = raw as { type?: unknown; payload?: unknown };
        if (typeof candidate.type !== 'string') return null;
        return { type: candidate.type, payload: candidate.payload };
      },
      onMessage: (event) => options.onEvent(event),
    });

    client.connect();
  };

  const disconnect = () => {
    client?.disconnect();
    client = null;
  };

  return {
    connect,
    disconnect,
  };
}
