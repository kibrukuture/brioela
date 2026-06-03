import { z } from '@brioela/shared/zod';

const querySchema = z.object({
	limit: z.coerce.number().int().positive().max(500).default(50),
	title: z.string().min(1).default('Stress Test'),
	body: z.string().min(1).default('This is a stress-test in-app notification.'),
});

export function parseSendInAppNotificationToAllUsersQuery(input: unknown) {
	return querySchema.safeParse(input);
}
