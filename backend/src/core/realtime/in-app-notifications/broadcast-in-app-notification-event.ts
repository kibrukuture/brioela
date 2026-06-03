import { getRedisClient } from '@/core/clients/redis';

export type InAppNotificationEvent =
	| {
			type: 'in_app_notification.created';
			payload: unknown;
	  }
	| {
			type: 'in_app_notification.updated';
			payload: unknown;
	  };

export async function broadcastInAppNotificationEvent(userId: string, event: InAppNotificationEvent) {
	const redis = getRedisClient();
	const channel = `in_app_notifications:${userId}`;
	await redis.publish(channel, JSON.stringify(event));
}
