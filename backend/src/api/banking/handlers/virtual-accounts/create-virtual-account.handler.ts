import { AppContext } from '@/index';
import getAlignClient from '@/core/clients/align';
import { getDb } from '@/core/database/client';
import { bankingVirtualAccounts, bankingWallets } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { createVirtualAccountSchema } from '@brioela/shared/validators/banking.validator';
import {
	isIBANAccountDetails,
	isInternationalWireAccountDetails,
	isUSAccountDetails,
	type CreateVirtualAccountRequest,
} from '@tolbel/align';
import { DEFAULT_ALIGN_DESTINATION_TOKEN, DEFAULT_WALLET_NETWORK } from '@brioela/shared/constants';
import assertUserKycApproved from '@/api/banking/helpers/virtual-accounts';
import { ErrorCode } from '@brioela/shared/types/api';
import { HTTPException } from 'hono/http-exception';

export async function createVirtualAccount(c: AppContext) {
	const user = c.get('user');
	if (!user)
		throw new HTTPException(ErrorCode.UNAUTHORIZED, {
			message: 'Unauthorized',
		});

	const body = await c.req.json();
	const parsed = createVirtualAccountSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: parsed.error.issues[0].message ?? 'Invalid input',
		});
	}

	const db = getDb();
	const { bankingCustomerId } = await assertUserKycApproved(db, user.id);

	const [wallet] = await db
		.select({ address: bankingWallets.address })
		.from(bankingWallets)
		.where(and(eq(bankingWallets.userId, user.id), eq(bankingWallets.isPrimary, true)))
		.limit(1);
	if (!wallet?.address) {
		throw new HTTPException(ErrorCode.NOT_FOUND, {
			message: 'Primary wallet not found',
		});
	}

	const requestedCurrency = parsed.data.currency;
	const [already] = await db
		.select()
		.from(bankingVirtualAccounts)
		.where(and(eq(bankingVirtualAccounts.userId, user.id), eq(bankingVirtualAccounts.currency, requestedCurrency)))
		.limit(1);
	if (already) {
		throw new HTTPException(ErrorCode.CONFLICT, {
			message: 'Virtual account already exists',
		});
	}

	const align = getAlignClient();

	const request: CreateVirtualAccountRequest = {
		source_currency: requestedCurrency,
		destination_token: DEFAULT_ALIGN_DESTINATION_TOKEN,
		destination_network: DEFAULT_WALLET_NETWORK,
		destination_address: wallet.address,
	};

	const created = await align.virtualAccounts.create(bankingCustomerId, request);

	const instructions = created.deposit_instructions;

	if (isIBANAccountDetails(instructions)) {
		const [inserted] = await db
			.insert(bankingVirtualAccounts)
			.values({
				userId: user.id,
				providerId: created.id,
				currency: requestedCurrency,
				bankName: instructions.bank_name,
				bankAddress: instructions.bank_address,
				bankingRails: instructions.payment_rails,
				accountBeneficiaryName: instructions.account_holder_name,
				iban: instructions.iban.iban_number,
				bic: instructions.iban.bic,
			})
			.returning();
		return inserted;
	}

	if (isInternationalWireAccountDetails(instructions)) {
		const [inserted] = await db
			.insert(bankingVirtualAccounts)
			.values({
				userId: user.id,
				providerId: created.id,
				currency: requestedCurrency,
				bankName: instructions.bank_name,
				bankAddress: instructions.bank_address,
				bankingRails: instructions.payment_rails,
				accountBeneficiaryName: instructions.account_beneficiary_name,
				accountBeneficiaryAddress: instructions.account_beneficiary_address,
				accountNumber: instructions.international_wire.account_number,
				routingNumber: instructions.international_wire.routing_number,
				bic: instructions.international_wire.bic,
			})
			.returning();
		return inserted;
	}

	if (isUSAccountDetails(instructions)) {
		const [inserted] = await db
			.insert(bankingVirtualAccounts)
			.values({
				userId: user.id,
				providerId: created.id,
				currency: requestedCurrency,
				bankName: instructions.bank_name,
				bankAddress: instructions.bank_address,
				bankingRails: instructions.payment_rails,
				accountBeneficiaryName: instructions.account_beneficiary_name,
				accountBeneficiaryAddress: instructions.account_beneficiary_address,
				accountNumber: instructions.us.account_number,
				routingNumber: instructions.us.routing_number,
			})
			.returning();
		return inserted;
	}

	throw new HTTPException(ErrorCode.UPSTREAM_ERROR, {
		message: 'Unsupported deposit instructions type returned by Align',
	});
}
