import type { CustomerAddress, DestinationBankAccount } from '@tolbel/align';
import type { PayRequestBankDetails } from '@schnl/shared/validators/pay-request.validator';

export function createOfframpDestinationBankAccount(params: {
	bankDetails: PayRequestBankDetails;
	accountHolderType: DestinationBankAccount['account_holder_type'];
	accountHolderFirstName: string;
	accountHolderLastName: string;
	accountHolderAddress: CustomerAddress;
}): DestinationBankAccount {
	const base = {
		bank_name: params.bankDetails.bankName,
		account_holder_type: params.accountHolderType,
		account_holder_first_name: params.accountHolderFirstName,
		account_holder_last_name: params.accountHolderLastName,
		account_holder_address: params.accountHolderAddress,
	};

	if (params.bankDetails.type === 'ach') {
		return {
			...base,
			account_type: 'us',
			us: {
				account_number: params.bankDetails.accountNumber,
				routing_number: params.bankDetails.routingNumber,
			},
		} satisfies DestinationBankAccount;
	}

	if (params.bankDetails.type === 'iban_sepa') {
		const bic = params.bankDetails.swift;
		return {
			...base,
			account_type: 'iban',
			iban: {
				iban_number: params.bankDetails.iban,
				bic,
			},
		} satisfies DestinationBankAccount;
	}

	const bic = params.bankDetails.swift;

	return {
		...base,
		account_type: 'iban',
		iban: {
			iban_number: params.bankDetails.iban,
			bic,
		},
	} satisfies DestinationBankAccount;
}
