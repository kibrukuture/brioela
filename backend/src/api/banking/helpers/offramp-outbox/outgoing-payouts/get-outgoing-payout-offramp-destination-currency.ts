import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import type { FiatCurrency } from '@tolbel/align';
import type { BankingOutgoingPayout } from '@schnl/shared/drizzle/schema/banking-outgoing-payouts.schema';

export function getOutgoingPayoutOfframpDestinationCurrency(payout: BankingOutgoingPayout): FiatCurrency {
	switch (payout.currency) {
		case 'usd':
			return 'usd';
		case 'eur':
			return 'eur';
		case 'aed':
			return 'aed';
		default:
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Unsupported payout currency for provider transfer' });
	}
}
