import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingCards, bankingLimits } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { bigintToString } from '@brioela/shared/utils/money';
import { cardIdParamSchema, cardSpendingLimitsResponseSchema } from '@brioela/shared/validators/card.validator';

export async function getCardSpendingLimits(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const paramValidation = cardIdParamSchema.safeParse({ cardId: c.req.param('cardId') });
	if (!paramValidation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: paramValidation.error.issues[0].message });
	}
	const { cardId } = paramValidation.data;

	const db = getDb();
	const [card] = await db
		.select({ currency: bankingCards.currency })
		.from(bankingCards)
		.where(and(eq(bankingCards.userId, user.id), eq(bankingCards.id, cardId)))
		.limit(1);

	if (!card) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Card not found' });

	const rows = await db
		.select({ period: bankingLimits.period, amountAtomic: bankingLimits.amountAtomic })
		.from(bankingLimits)
		.where(and(eq(bankingLimits.userId, user.id), eq(bankingLimits.currency, card.currency), eq(bankingLimits.scope, 'card')));

	const daily = rows.find((r) => r.period === 'daily');
	const monthly = rows.find((r) => r.period === 'monthly');

	const validation = cardSpendingLimitsResponseSchema.safeParse({
		cardId,
		dailyLimitAtomic: daily ? bigintToString(daily.amountAtomic) : null,
		monthlyLimitAtomic: monthly ? bigintToString(monthly.amountAtomic) : null,
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
