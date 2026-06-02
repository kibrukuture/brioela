import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { and, eq } from '@schnl/shared/drizzle';
import { bankingCustomerAddresses, bankingExternalAccounts } from '@schnl/shared/drizzle/schema';
import { BANKING_PROVIDERS } from '@schnl/shared/constants/banking-providers';
import type { Tx } from '@/api/banking/helpers/ledger/types';
import type { CreateOutgoingPayoutInput } from '@schnl/shared/validators/outgoing-payout.validator';
import { HolderType } from '@schnl/shared/drizzle/schema/banking-enums.schema';

export async function createOrGetExternalAccountId(params: {
	tx: Tx;
	userId: string;
	label: string;
	recipientFullName: string;
	currency: CreateOutgoingPayoutInput['currency'];
	bankDetails: CreateOutgoingPayoutInput['bankDetails'];
}): Promise<string> {
	if (!params.label.trim()) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Label is required when saving recipient' });
	}

	const [address] = await params.tx
		.select({
			streetLine1: bankingCustomerAddresses.streetLine1,
			city: bankingCustomerAddresses.city,
			state: bankingCustomerAddresses.state,
			postalCode: bankingCustomerAddresses.postalCode,
			country: bankingCustomerAddresses.country,
		})
		.from(bankingCustomerAddresses)
		.where(and(eq(bankingCustomerAddresses.userId, params.userId), eq(bankingCustomerAddresses.provider, BANKING_PROVIDERS.ALIGN)))
		.limit(1);

	if (!address?.streetLine1 || !address.city || !address.state || !address.postalCode || !address.country) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: 'Your address is required before saving a recipient. Please complete KYC first.',
		});
	}

	const countryCode = params.bankDetails.type === 'ach' ? 'US' : String(params.bankDetails.iban).slice(0, 2).toUpperCase();

	const [existing] = await params.tx
		.select({ id: bankingExternalAccounts.id })
		.from(bankingExternalAccounts)
		.where(and(eq(bankingExternalAccounts.userId, params.userId), eq(bankingExternalAccounts.label, params.label)))
		.limit(1);

	if (existing?.id) return existing.id;

	const accountHolderType: (typeof HolderType.enumValues)[number] = 'individual';

	const values = {
		userId: params.userId,
		accountHolderName: params.recipientFullName,
		// TODO:  this must come form somewhere else. dont assum every accoutn is "individual"
		accountHolderType,
		bankName: params.bankDetails.bankName,
		countryCode,
		label: params.label,
		currency: params.currency,
		iban: params.bankDetails.type === 'ach' ? null : params.bankDetails.iban,
		bic: params.bankDetails.type === 'ach' ? null : params.bankDetails.swift,
		accountNumber: params.bankDetails.type === 'ach' ? params.bankDetails.accountNumber : null,
		routingNumber: params.bankDetails.type === 'ach' ? params.bankDetails.routingNumber : null,
		accountType: params.bankDetails.type === 'ach' ? params.bankDetails.accountType : null,
		sortCode: null,
		streetLine1: address.streetLine1,
		city: address.city,
		state: address.state,
		postalCode: address.postalCode,
		country: address.country,
	};

	const [created] = await params.tx.insert(bankingExternalAccounts).values(values).returning({ id: bankingExternalAccounts.id });
	if (!created?.id) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Failed to save external account' });
	}
	return created.id;
}
