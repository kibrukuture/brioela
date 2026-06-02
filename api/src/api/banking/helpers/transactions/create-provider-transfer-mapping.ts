import type { Tx } from '@/api/banking/helpers/ledger/types';
import { bankingProviderTransferMappings } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { BankingCurrency, BankingRail, BankingTransactionReferenceType } from '@schnl/shared/drizzle/schema/banking-enums.schema';
import { ProviderTransferMappingStatus } from '@schnl/shared/drizzle/schema';

export async function createProviderTransferMapping(params: {
	tx: Tx;
	userId: string;
	amountAtomic: bigint;
	currency: (typeof BankingCurrency.enumValues)[number];
	rail: (typeof BankingRail.enumValues)[number] | null;
	provider: string;
	providerTransferId: string;
	providerTxHash: string | null;
	referenceType: (typeof BankingTransactionReferenceType.enumValues)[number];
	referenceId: string;
	status: (typeof ProviderTransferMappingStatus.enumValues)[number];
	payload?: unknown;
}): Promise<void> {
	const [existing] = await params.tx
		.select({ id: bankingProviderTransferMappings.id })
		.from(bankingProviderTransferMappings)
		.where(
			and(
				eq(bankingProviderTransferMappings.provider, params.provider),
				eq(bankingProviderTransferMappings.providerTransferId, params.providerTransferId)
			)
		)
		.limit(1);

	if (existing?.id) return;

	await params.tx.insert(bankingProviderTransferMappings).values({
		userId: params.userId,
		amountAtomic: params.amountAtomic,
		currency: params.currency,
		rail: params.rail,
		provider: params.provider,
		providerTransferId: params.providerTransferId,
		providerTxHash: params.providerTxHash,
		referenceType: params.referenceType,
		referenceId: params.referenceId,
		status: params.status,
		payload: params.payload ?? null,
	});
}
