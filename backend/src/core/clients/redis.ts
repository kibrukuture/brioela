import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

export function getRedisClient() {
	if (redisClient) return redisClient;
	redisClient = new Redis({
		url: process.env.REDIS_URL,
		token: process.env.REDIS_TOKEN,
	});
	return redisClient;
}
