import type { WSContext } from 'hono/ws';

type ConnectionStore = {
	addConnection: (userId: string, socket: WSContext<WebSocket>) => void;
	removeConnection: (userId: string, socket: WSContext<WebSocket>) => void;
	getConnections: (userId: string) => Set<WSContext<WebSocket>>;
};

const connectionsByUserId = new Map<string, Set<WSContext<WebSocket>>>();

export function getInAppNotificationsConnectionStore(): ConnectionStore {
	return {
		addConnection: (userId, socket) => {
			const existing = connectionsByUserId.get(userId);
			if (existing) {
				existing.add(socket);
				return;
			}
			connectionsByUserId.set(userId, new Set([socket]));
		},
		removeConnection: (userId, socket) => {
			const existing = connectionsByUserId.get(userId);
			if (!existing) return;
			existing.delete(socket);
			if (existing.size === 0) {
				connectionsByUserId.delete(userId);
			}
		},
		getConnections: (userId) => {
			return connectionsByUserId.get(userId) ?? new Set<WSContext<WebSocket>>();
		},
	};
}
