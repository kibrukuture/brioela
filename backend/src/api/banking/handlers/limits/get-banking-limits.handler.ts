import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingLimits } from '@brioela/shared/drizzle/schema';
import { eq } from '@brioela/shared/drizzle';
import { ErrorCode } from '@brioela/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { getBankingLimitsResponseSchema } from '@brioela/shared/validators/banking-limit.validator';
import { bigintToString } from '@brioela/shared/utils/money';

export async function getBankingLimits(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const db = getDb();
	const rows = await db.select().from(bankingLimits).where(eq(bankingLimits.userId, user.id));

	const limits = rows.map((row) => ({
		currency: row.currency,
		scope: row.scope,
		period: row.period,
		amountAtomic: bigintToString(row.amountAtomic),
	}));

	const validation = getBankingLimitsResponseSchema.safeParse({ limits });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
