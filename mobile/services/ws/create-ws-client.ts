import { PUBLIC_URLS } from '@schnl/shared/constants';

type WsClientOptions<TMessage> = {
  path: string;
  query?: Record<string, string>;
  parseMessage: (raw: unknown) => TMessage | null;
  onMessage: (message: TMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: () => void;
};

type WsClient = {
  connect: () => void;
  disconnect: () => void;
  sendJson: (payload: unknown) => void;
};

export function createWsClient<TMessage>(options: WsClientOptions<TMessage>): WsClient {
  const httpBase = PUBLIC_URLS.PUBLIC_API_BASE_URL;
  const wsBase = httpBase.startsWith('https://')
    ? httpBase.replace('https://', 'wss://')
    : httpBase.startsWith('http://')
      ? httpBase.replace('http://', 'ws://')
      : httpBase;

  const queryEntries = Object.entries(options.query ?? {}).filter(([, v]) => v.length > 0);
  const queryString =
    queryEntries.length === 0
      ? ''
      : `?${queryEntries
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&')}`;

  const url = `${wsBase}${options.path}${queryString}`;

  let socket: WebSocket | null = null;

  const connect = () => {
    if (socket) return;

    socket = new WebSocket(url);

    socket.onopen = () => {
      options.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const parsedRaw = JSON.parse(event.data as string) as unknown;
        const parsed = options.parseMessage(parsedRaw);
        if (!parsed) return;
        options.onMessage(parsed);
      } catch {
        // ignore
      }
    };

    socket.onerror = () => {
      options.onError?.();
    };

    socket.onclose = () => {
      socket = null;
      options.onClose?.();
    };
  };

  const disconnect = () => {
    if (!socket) return;
    try {
      socket.close();
    } catch {
      socket = null;
    }
  };

  const sendJson = (payload: unknown) => {
    if (!socket) return;
    try {
      socket.send(JSON.stringify(payload));
    } catch {
      // ignore
    }
  };

  return {
    connect,
    disconnect,
    sendJson,
  };
}
