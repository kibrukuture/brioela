import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import type { PaymentRail } from '@tolbel/align';
import type { PayRequestBankDetails } from '@schnl/shared/validators/pay-request.validator';

export function getPeerToPeerOfframpPaymentRail(bankDetails: PayRequestBankDetails): PaymentRail {
	switch (bankDetails.type) {
		case 'ach':
			return 'ach';
		case 'iban_sepa':
			return 'sepa';
		case 'iban_single':
			return 'uaefts';
		default:
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Unsupported payout rail' });
	}
}
