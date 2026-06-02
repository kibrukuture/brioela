import { nanoid } from 'nanoid';
import { getRedisClient } from '@/core/clients/redis';

type TicketStore = {
	mint: (userId: string, ttlMs: number) => Promise<{ ticket: string; expiresAt: Date }>;
	consume: (ticket: string) => Promise<string | null>;
};

export async function getInAppNotificationsWsTicketStore(): Promise<TicketStore> {
	const redis = getRedisClient();
	return {
		mint: async (userId, ttlMs) => {
			const ticket = nanoid(32);
			const expiresAt = new Date(Date.now() + ttlMs);
			await redis.setex(`ws_ticket:${ticket}`, Math.ceil(ttlMs / 1000), userId);
			return { ticket, expiresAt };
		},
		consume: async (ticket) => {
			const key = `ws_ticket:${ticket}`;
			const userId = (await redis.get(key)) as string | null;
			if (!userId) return null;
			await redis.del(key);
			return userId;
		},
	};
}
