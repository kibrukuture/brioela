import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import type { FiatCurrency } from '@tolbel/align';
import type { BankingPayRequest } from '@schnl/shared/drizzle/schema/banking-pay-requests.schema';

export function getPayRequestOfframpDestinationCurrency(req: BankingPayRequest): FiatCurrency {
	switch (req.payoutCurrency) {
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
