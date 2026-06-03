import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import type { BankingOutgoingPayout } from '@brioela/shared/drizzle/schema/banking-outgoing-payouts.schema';
import type { Tx } from '@/api/banking/helpers/ledger/types';
import { bankingExternalAccounts } from '@brioela/shared/drizzle/schema/banking-external-accounts.schema';
import { eq } from '@brioela/shared/drizzle';
import { decryptWithAES256GCM } from '@/core/crypto/decrypt-with-aes-256-gcm';
import { parsePayoutBankDetails } from '@/api/banking/helpers/parsers/parse-payout-bank-details';
import type { PayRequestBankDetails } from '@brioela/shared/validators/pay-request.validator';

export async function getOutgoingPayoutOfframpBankDetails(params: {
	tx: Tx;
	payout: BankingOutgoingPayout;
}): Promise<PayRequestBankDetails> {
	if (params.payout.destinationExternalAccountId) {
		const [ext] = await params.tx
			.select()
			.from(bankingExternalAccounts)
			.where(eq(bankingExternalAccounts.id, params.payout.destinationExternalAccountId))
			.limit(1);
		if (!ext) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'External account not found' });
		if (ext.currency !== params.payout.currency) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'External account currency mismatch' });
		}

		const bankName = ext.bankName ?? '';
		if (!bankName.trim()) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Saved external account is missing bank name' });
		}

		const isAch = Boolean(ext.accountNumber) && Boolean(ext.routingNumber);
		if (isAch) {
			if (!ext.accountType) {
				throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Saved external account is missing account type' });
			}
			return {
				type: 'ach',
				bankName,
				accountNumber: ext.accountNumber ?? '',
				routingNumber: ext.routingNumber ?? '',
				accountType: ext.accountType,
			} satisfies PayRequestBankDetails;
		}

		if (!ext.iban || !ext.bic) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Saved external account is missing IBAN details' });
		}

		const type: PayRequestBankDetails['type'] = params.payout.currency === 'eur' ? 'iban_sepa' : 'iban_single';
		return { type, bankName, iban: ext.iban, swift: ext.bic } satisfies PayRequestBankDetails;
	}

	if (!params.payout.encryptedDestinationBankDetails) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Missing payout details' });
	}

	const decrypted = decryptWithAES256GCM(params.payout.encryptedDestinationBankDetails);
	let parsedJson: unknown;
	try {
		parsedJson = JSON.parse(decrypted);
	} catch {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid stored payout details' });
	}

	return parsePayoutBankDetails(parsedJson);
}
