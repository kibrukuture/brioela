import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingCards } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { cardIdParamSchema, freezeCardResponseSchema } from '@schnl/shared/validators/card.validator';
import dayjs from 'dayjs';

export async function freezeCard(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const paramValidation = cardIdParamSchema.safeParse({ cardId: c.req.param('cardId') });
	if (!paramValidation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: paramValidation.error.issues[0].message });
	}
	const { cardId } = paramValidation.data;

	const db = getDb();
	const [updated] = await db
		.update(bankingCards)
		.set({ status: 'frozen', updatedAt: dayjs().toDate() })
		.where(and(eq(bankingCards.userId, user.id), eq(bankingCards.id, cardId)))
		.returning({ id: bankingCards.id, status: bankingCards.status });

	if (!updated) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Card not found' });

	const validation = freezeCardResponseSchema.safeParse({ cardId: updated.id, status: updated.status });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
