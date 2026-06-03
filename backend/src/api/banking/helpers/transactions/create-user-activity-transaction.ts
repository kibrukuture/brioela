import type { Tx } from '@/api/banking/helpers/ledger/types';
import { bankingTransactions } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import {
	BankingCurrency,
	BankingRail,
	BankingTransactionReferenceType,
	TransactionDirection,
	TransactionStatus,
	TransactionType,
} from '@brioela/shared/drizzle/schema/banking-enums.schema';
import type { BankingTransactionCategory } from '@brioela/shared/validators/banking-transaction-category.validator';

export async function createUserActivityTransaction(params: {
	tx: Tx;
	userId: string;
	type: (typeof TransactionType.enumValues)[number];
	direction: (typeof TransactionDirection.enumValues)[number];
	status: (typeof TransactionStatus.enumValues)[number];
	amountAtomic: bigint;
	currency: (typeof BankingCurrency.enumValues)[number];
	rail: (typeof BankingRail.enumValues)[number] | null;
	referenceType: (typeof BankingTransactionReferenceType.enumValues)[number];
	referenceId: string;
	description: string;
	category?: BankingTransactionCategory | null;
	createdAt: Date;
}): Promise<void> {
	const [existing] = await params.tx
		.select({ id: bankingTransactions.id })
		.from(bankingTransactions)
		.where(
			and(
				eq(bankingTransactions.userId, params.userId),
				eq(bankingTransactions.referenceType, params.referenceType),
				eq(bankingTransactions.referenceId, params.referenceId),
				eq(bankingTransactions.type, params.type),
				eq(bankingTransactions.direction, params.direction)
			)
		)
		.limit(1);

	if (existing?.id) return;

	await params.tx.insert(bankingTransactions).values({
		userId: params.userId,
		type: params.type,
		direction: params.direction,
		status: params.status,
		amountAtomic: params.amountAtomic,
		currency: params.currency,
		rail: params.rail,
		referenceType: params.referenceType,
		referenceId: params.referenceId,
		description: params.description,
		category: params.category ?? null,
		createdAt: params.createdAt,
	});
}
