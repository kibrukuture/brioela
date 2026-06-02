import type { Tx } from '@/api/banking/helpers/ledger/types';
import { bankingTransactions } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { BankingTransactionReferenceType } from '@schnl/shared/drizzle/schema/banking-enums.schema';

export async function finalizeReferenceTransactionsFailed(params: {
	tx: Tx;
	referenceType: (typeof BankingTransactionReferenceType.enumValues)[number];
	referenceId: string;
}): Promise<void> {
	await params.tx
		.update(bankingTransactions)
		.set({ status: 'failed' })
		.where(and(eq(bankingTransactions.referenceType, params.referenceType), eq(bankingTransactions.referenceId, params.referenceId)));
}
