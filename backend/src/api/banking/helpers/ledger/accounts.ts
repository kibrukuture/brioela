import { and, eq } from '@brioela/shared/drizzle';
import { bankingLedgerAccounts } from '@brioela/shared/drizzle/schema';
import type { BankingCurrencyCode, Tx } from '@/api/banking/helpers/ledger/types';

export async function ensureLedgerAccount(params: { tx: Tx; userId: string; currency: BankingCurrencyCode }) {
	const [existing] = await params.tx
		.select()
		.from(bankingLedgerAccounts)
		.where(and(eq(bankingLedgerAccounts.userId, params.userId), eq(bankingLedgerAccounts.currency, params.currency)))
		.limit(1);

	if (existing) return existing;

	const [created] = await params.tx
		.insert(bankingLedgerAccounts)
		.values({
			userId: params.userId,
			currency: params.currency,
			balanceAvailableAtomic: 0n,
			balanceHeldAtomic: 0n,
		})
		.returning();

	return created;
}
