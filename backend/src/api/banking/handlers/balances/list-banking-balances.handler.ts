import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingLedgerAccounts } from '@schnl/shared/drizzle/schema';
import { desc, eq } from '@schnl/shared/drizzle';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { listBankingBalancesResponseSchema } from '@schnl/shared/validators/banking-balance.validator';
import { bigintToString } from '@schnl/shared/utils/money';

export async function listBankingBalances(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const db = getDb();
	const rows = await db
		.select()
		.from(bankingLedgerAccounts)
		.where(eq(bankingLedgerAccounts.userId, user.id))
		.orderBy(desc(bankingLedgerAccounts.updatedAt));

	const balances = rows.map((row) => ({
		currency: row.currency,
		availableAtomic: bigintToString(row.balanceAvailableAtomic),
		heldAtomic: bigintToString(row.balanceHeldAtomic),
	}));

	const validation = listBankingBalancesResponseSchema.safeParse({ balances });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
