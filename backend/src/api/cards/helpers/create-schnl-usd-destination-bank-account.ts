import { SCHNL_USD_BANK_ACCOUNT } from '@schnl/shared/constants/schnl-usd-bank-account';
import { createOfframpDestinationBankAccount } from '@/api/banking/helpers/payout/create-offramp-destination-bank-account';
import type { DestinationBankAccount } from '@tolbel/align';
import type { PayRequestBankDetails } from '@schnl/shared/validators/pay-request.validator';

export function createSchnlUsdDestinationBankAccount(): DestinationBankAccount {
	const bankDetails: PayRequestBankDetails = {
		type: 'ach',
		bankName: SCHNL_USD_BANK_ACCOUNT.bankName,
		accountNumber: SCHNL_USD_BANK_ACCOUNT.accountNumber,
		routingNumber: SCHNL_USD_BANK_ACCOUNT.routingNumber,
		accountType: 'checking',
	};

	return createOfframpDestinationBankAccount({
		bankDetails,
		accountHolderType: 'business',
		accountHolderFirstName: 'Schnl',
		accountHolderLastName: 'Inc',
		accountHolderAddress: {
			country: SCHNL_USD_BANK_ACCOUNT.company_address.country,
			city: SCHNL_USD_BANK_ACCOUNT.company_address.city,
			street_line_1: SCHNL_USD_BANK_ACCOUNT.company_address.address_line_1,
			postal_code: SCHNL_USD_BANK_ACCOUNT.company_address.postCode,
			state: SCHNL_USD_BANK_ACCOUNT.company_address.state,
		},
	});
}
