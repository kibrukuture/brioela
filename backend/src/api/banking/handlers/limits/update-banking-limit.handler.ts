import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingLimits } from '@schnl/shared/drizzle/schema';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { updateBankingLimitInputSchema, updateBankingLimitResponseSchema } from '@schnl/shared/validators/banking-limit.validator';
import { bigintToString, parseAmountAtomic } from '@schnl/shared/utils/money';

export async function updateBankingLimit(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = updateBankingLimitInputSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0].message });
	}

	const db = getDb();
	const [updated] = await db
		.insert(bankingLimits)
		.values({
			userId: user.id,
			currency: parsed.data.currency,
			scope: parsed.data.scope,
			period: parsed.data.period,
			amountAtomic: parseAmountAtomic(parsed.data.amountAtomic),
		})
		.onConflictDoUpdate({
			target: [bankingLimits.userId, bankingLimits.currency, bankingLimits.scope, bankingLimits.period],
			set: {
				amountAtomic: parseAmountAtomic(parsed.data.amountAtomic),
				updatedAt: new Date(),
			},
		})
		.returning();

	if (!updated) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Failed to update limit' });
	}

	const validation = updateBankingLimitResponseSchema.safeParse({
		limit: {
			currency: updated.currency,
			scope: updated.scope,
			period: updated.period,
			amountAtomic: bigintToString(updated.amountAtomic),
		},
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
