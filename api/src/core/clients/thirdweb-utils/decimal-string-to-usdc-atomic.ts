import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { getBankingCurrencyDecimals } from '@schnl/shared/constants/banking-currency-decimals';
import { ethers } from '@tolbel/align';
import type { SupportedStableCurrency } from '@schnl/shared/constants/supported-stable-currencies';

export function decimalStringToStableAtomic(input: { amountDecimal: string; currency: SupportedStableCurrency }) {
	if (!input.amountDecimal) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Missing amountDecimal' });
	}
	if (!input.currency) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Missing currency' });
	}

	const decimals = getBankingCurrencyDecimals(input.currency);
	try {
		return ethers.parseUnits(input.amountDecimal, decimals);
	} catch {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid amountDecimal' });
	}
}
