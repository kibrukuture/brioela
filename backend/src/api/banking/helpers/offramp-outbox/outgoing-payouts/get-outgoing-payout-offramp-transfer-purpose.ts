import { parseTransferPurpose } from '@/api/banking/helpers/parsers/parse-transfer-purpose';
import type { TransferPurpose } from '@tolbel/align';
import type { BankingOutgoingPayout } from '@brioela/shared/drizzle/schema/banking-outgoing-payouts.schema';

export function getOutgoingPayoutOfframpTransferPurpose(params: {
	payout: BankingOutgoingPayout;
	payloadTransferPurpose?: string;
}): TransferPurpose {
	return parseTransferPurpose(params.payout.transferPurpose ?? params.payloadTransferPurpose);
}
