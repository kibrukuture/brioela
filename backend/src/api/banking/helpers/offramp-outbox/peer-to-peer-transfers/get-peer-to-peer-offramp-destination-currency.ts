import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import type { FiatCurrency } from '@tolbel/align';
import type { BankingPeerToPeerTransfer } from '@schnl/shared/drizzle/schema/banking-peer-to-peer-transfers.schema';

export function getPeerToPeerOfframpDestinationCurrency(transfer: BankingPeerToPeerTransfer): FiatCurrency {
	switch (transfer.currency) {
		case 'usd':
			return 'usd';
		case 'eur':
			return 'eur';
		case 'aed':
			return 'aed';
		default:
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Unsupported currency for provider transfer' });
	}
}
