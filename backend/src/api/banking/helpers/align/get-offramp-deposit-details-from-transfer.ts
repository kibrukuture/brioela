import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { Transfer } from '@tolbel/align';

export function getOfframpDepositDetailsFromTransfer(transfer: Transfer): {
	depositAddress: string;
	depositAmountDecimal: string;
} {
	const depositAddress = transfer.quote?.deposit_blockchain_address;
	if (!depositAddress) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'Missing deposit_blockchain_address on transfer quote' });
	}

	const depositAmountDecimal = transfer.quote?.deposit_amount ?? transfer.quote?.source_amount;
	if (!depositAmountDecimal) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message: 'Missing deposit_amount on transfer quote' });
	}

	return {
		depositAddress,
		depositAmountDecimal,
	};
}
