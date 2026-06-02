import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingCards, bankingLimits } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { parseAmountAtomic, bigintToString } from '@schnl/shared/utils/money';
import { cardIdParamSchema, cardSpendingLimitsSchema, cardSpendingLimitsResponseSchema } from '@schnl/shared/validators/card.validator';
import dayjs from 'dayjs';

export async function updateCardSpendingLimits(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const paramValidation = cardIdParamSchema.safeParse({ cardId: c.req.param('cardId') });
	if (!paramValidation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: paramValidation.error.issues[0].message });
	}
	const { cardId } = paramValidation.data;

	const body = await c.req.json();
	const parsed = cardSpendingLimitsSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0].message });
	}

	const db = getDb();
	const [card] = await db
		.select({ currency: bankingCards.currency })
		.from(bankingCards)
		.where(and(eq(bankingCards.userId, user.id), eq(bankingCards.id, cardId)))
		.limit(1);

	if (!card) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Card not found' });

	if (parsed.data.dailyLimitAtomic) {
		await db
			.insert(bankingLimits)
			.values({
				userId: user.id,
				currency: card.currency,
				scope: 'card',
				period: 'daily',
				amountAtomic: parseAmountAtomic(parsed.data.dailyLimitAtomic),
			})
			.onConflictDoUpdate({
				target: [bankingLimits.userId, bankingLimits.currency, bankingLimits.scope, bankingLimits.period],
				set: { amountAtomic: parseAmountAtomic(parsed.data.dailyLimitAtomic), updatedAt: dayjs().toDate() },
			});
	}

	if (parsed.data.monthlyLimitAtomic) {
		await db
			.insert(bankingLimits)
			.values({
				userId: user.id,
				currency: card.currency,
				scope: 'card',
				period: 'monthly',
				amountAtomic: parseAmountAtomic(parsed.data.monthlyLimitAtomic),
			})
			.onConflictDoUpdate({
				target: [bankingLimits.userId, bankingLimits.currency, bankingLimits.scope, bankingLimits.period],
				set: { amountAtomic: parseAmountAtomic(parsed.data.monthlyLimitAtomic), updatedAt: dayjs().toDate() },
			});
	}

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
