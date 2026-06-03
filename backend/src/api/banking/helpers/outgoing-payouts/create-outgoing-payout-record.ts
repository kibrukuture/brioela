import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { bankingOutgoingPayouts } from '@brioela/shared/drizzle/schema/banking-outgoing-payouts.schema';
import type { Tx } from '@/api/banking/helpers/ledger/types';
import type { CreateOutgoingPayoutInput } from '@brioela/shared/validators/outgoing-payout.validator';
import { parseAmountAtomic } from '@brioela/shared/utils/money';

export async function createOutgoingPayoutRecord(params: {
	tx: Tx;
	userId: string;
	amountAtomic: string;
	currency: CreateOutgoingPayoutInput['currency'];
	transferPurpose: CreateOutgoingPayoutInput['transferPurpose'];
	destinationExternalAccountId: string | null;
	encryptedDestinationBankDetails: string;
}): Promise<{ id: string }> {
	let amountAtomic: bigint;
	try {
		amountAtomic = parseAmountAtomic(params.amountAtomic);
	} catch (error: unknown) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: error instanceof Error ? error.message : 'Invalid amountAtomic',
		});
	}

	const [payout] = await params.tx
		.insert(bankingOutgoingPayouts)
		.values({
			userId: params.userId,
			amountAtomic,
			currency: params.currency,
			status: 'created',
			destinationExternalAccountId: params.destinationExternalAccountId,
			encryptedDestinationBankDetails: params.encryptedDestinationBankDetails,
			transferPurpose: params.transferPurpose,
			providerTransferId: null,
		})
		.returning({ id: bankingOutgoingPayouts.id });

	if (!payout?.id) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Failed to create payout' });
	}

	return { id: payout.id };
}
