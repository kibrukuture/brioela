import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import type { BankingVirtualAccount } from '@schnl/shared/drizzle/schema/banking-virtual-accounts.schema';
import type { PayRequestBankDetails } from '@schnl/shared/validators/pay-request.validator';

export function getBankDetailsFromVirtualAccount(params: { virtualAccount: BankingVirtualAccount }): PayRequestBankDetails {
	const bankName = params.virtualAccount.bankName ?? '';
	if (!bankName.trim()) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient bank name missing' });
	}

	if (params.virtualAccount.currency === 'usd') {
		const accountNumber = params.virtualAccount.accountNumber ?? '';
		const routingNumber = params.virtualAccount.routingNumber ?? '';
		if (!accountNumber.trim() || !routingNumber.trim()) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient USD bank account details missing' });
		}

		return {
			type: 'ach',
			bankName,
			accountNumber,
			routingNumber,
			accountType: 'checking',
		} satisfies PayRequestBankDetails;
	}

	const iban = params.virtualAccount.iban ?? '';
	const swift = params.virtualAccount.bic ?? '';
	if (!iban.trim() || !swift.trim()) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient IBAN bank account details missing' });
	}

	if (params.virtualAccount.currency === 'eur') {
		return {
			type: 'iban_sepa',
			bankName,
			iban,
			swift,
		} satisfies PayRequestBankDetails;
	}

	if (params.virtualAccount.currency === 'aed') {
		return {
			type: 'iban_single',
			bankName,
			iban,
			swift,
		} satisfies PayRequestBankDetails;
	}

	throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
		message: 'Unsupported recipient bank currency',
	});
}
