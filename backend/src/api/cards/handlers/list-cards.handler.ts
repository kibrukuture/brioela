import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingCards } from '@brioela/shared/drizzle/schema';
import { and, eq, not } from '@brioela/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function listCards(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const db = getDb();
	const rows = await db
		.select()
		.from(bankingCards)
		.where(and(eq(bankingCards.userId, user.id), not(eq(bankingCards.status, 'cancelled'))));

	return {
		cards: rows.map((row) => ({
			id: row.id,
			type: row.type,
			status: row.status,
			brand: row.brand,
			last4: row.last4,
			expiryMonth: row.expiryMonth,
			expiryYear: row.expiryYear,
			currency: row.currency,
			cardholderFirstName: row.cardholderFirstName ?? null,
			cardholderLastName: row.cardholderLastName ?? null,
			label: row.label ?? null,
			theme: row.theme ?? null,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
		})),
	};
}
