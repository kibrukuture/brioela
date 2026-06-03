import { HTTPException } from 'hono/http-exception';
import type { AppContext } from '@/index';
import { getInAppNotificationsWsTicketStore } from '@/core/realtime/in-app-notifications/get-in-app-notifications-ws-ticket-store';
import { mintInAppNotificationsWsTicketResponseSchema } from '@brioela/shared/validators/in-app-notifications-ws-ticket.validator';

export async function mintInAppNotificationsWsTicketHandler(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(401, { message: 'Unauthorized' });

	const store = await getInAppNotificationsWsTicketStore();
	const { ticket, expiresAt } = await store.mint(user.id, 60_000);

	const validation = mintInAppNotificationsWsTicketResponseSchema.safeParse({
		ticket,
		expiresAt,
	});
	if (!validation.success) {
		throw new HTTPException(500, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
