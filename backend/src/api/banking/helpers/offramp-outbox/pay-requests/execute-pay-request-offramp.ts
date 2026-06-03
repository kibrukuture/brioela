import dayjs from 'dayjs';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { getDb } from '@/core/database/client';
import getAlignClient from '@/core/clients/align';
import { and, eq } from '@brioela/shared/drizzle';
import { bankingCustomerAddresses, bankingCustomerKyc, bankingLedgerHolds, bankingPayRequests, users } from '@brioela/shared/drizzle/schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { DEFAULT_ALIGN_DESTINATION_TOKEN, DEFAULT_WALLET_NETWORK } from '@brioela/shared/constants';
import { BANKING_PROVIDERS } from '@brioela/shared/constants/banking-providers';
import type { DestinationBankAccount, FiatCurrency, PaymentRail, TransferPurpose } from '@tolbel/align';
import { BankingCurrency } from '@brioela/shared/drizzle/schema/banking-enums.schema';
import { decryptWithAES256GCM } from '@/core/crypto/decrypt-with-aes-256-gcm';
import { payRequestBankDetailsSchema } from '@brioela/shared/validators/pay-request.validator';
import { atomicToDecimalString } from '@brioela/shared/utils/money';
import { parseTransferPurpose } from '@/api/banking/helpers/parsers/parse-transfer-purpose';
import { createOfframpDestinationBankAccount } from '@/api/banking/helpers/payout/create-offramp-destination-bank-account';
import { getPayRequestOfframpPaymentRail } from '@/api/banking/helpers/offramp-outbox/pay-requests/get-pay-request-offramp-payment-rail';
import { getPayRequestOfframpDestinationCurrency } from '@/api/banking/helpers/offramp-outbox/pay-requests/get-pay-request-offramp-destination-currency';
import { getOfframpDepositDetailsFromTransfer } from '@/api/banking/helpers/align/get-offramp-deposit-details-from-transfer';
import { getActiveWalletSessionForUser } from '@/core/clients/thirdweb-utils/get-active-wallet-session-for-user';
import { decimalStringToStableAtomic } from '@/core/clients/thirdweb-utils/decimal-string-to-usdc-atomic';
import { sendErc20TransferWithSessionKey } from '@/core/clients/thirdweb-utils/send-erc20-transfer-with-session-key';
import { CHAIN_IDS, USDC_BY_CHAIN } from '@brioela/shared/constants';
import { SUPPORTED_STABLE_CURRENCIES } from '@brioela/shared/constants/supported-stable-currencies';
import { createUserActivityTransaction } from '@/api/banking/helpers/transactions/create-user-activity-transaction';
import { createProviderTransferMapping } from '@/api/banking/helpers/transactions/create-provider-transfer-mapping';
import { payRequestOfframpOutboxPayloadSchema } from '@brioela/shared/validators/offramp-outbox-payloads.validator';

export async function executePayRequestOfframp(params: { payRequestId: string; payload: unknown }) {
	const db = getDb();
	type Prepared =
		| { handled: true }
		| {
				handled: false;
				senderUserId: string;
				senderCustomerId: string;
				recipientUserId: string;
				recipientPaymentRails: PaymentRail;
				destinationCurrency: FiatCurrency;
				destinationAmount: string;
				destinationBankAccount: DestinationBankAccount;
				transferPurpose: TransferPurpose;
				amountAtomic: bigint;
				sourceCurrency: (typeof BankingCurrency.enumValues)[number];
				payoutCurrency: (typeof BankingCurrency.enumValues)[number];
		  };

	const prepared = await db.transaction(async (tx): Promise<Prepared> => {
		const [req] = await tx.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, params.payRequestId)).limit(1);
		if (!req) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Pay request not found' });
		if (req.providerTransferId) return { handled: true };
		if (req.status !== 'in_flight' && req.status !== 'processing') return { handled: true };
		if (!req.encryptedPayoutDetails) throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Missing payout details' });
		if (!req.transferPurpose)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Transfer purpose is required before executing payout' });

		const [sender] = await tx
			.select({ id: users.id, bankingCustomerId: users.bankingCustomerId, bankingKycStatus: users.bankingKycStatus })
			.from(users)
			.where(eq(users.id, req.senderUserId))
			.limit(1);
		if (!sender?.id || !sender.bankingCustomerId)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Sender is not ready for payout' });
		if (sender.bankingKycStatus !== 'approved')
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Sender KYC not approved' });

		const [hold] = await tx
			.select()
			.from(bankingLedgerHolds)
			.where(
				and(
					eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.PAY_REQUEST),
					eq(bankingLedgerHolds.referenceId, req.id)
				)
			)
			.limit(1);
		if (!hold) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Hold not found' });
		if (hold.userId !== sender.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
		if (hold.status !== 'active') throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold is not active' });
		if (hold.expiresAt && dayjs(hold.expiresAt).isBefore(dayjs()))
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold has expired' });

		const payloadValidation = payRequestOfframpOutboxPayloadSchema.safeParse(params.payload);
		if (!payloadValidation.success) {
			throw new HTTPException(ErrorCode.BAD_REQUEST, { message: payloadValidation.error.issues[0]?.message ?? 'Invalid outbox payload' });
		}

		const decrypted = decryptWithAES256GCM(req.encryptedPayoutDetails);
		let payoutDetailsJson: unknown;
		try {
			payoutDetailsJson = JSON.parse(decrypted);
		} catch {
			throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid stored payout details' });
		}
		const payoutDetailsParsed = payRequestBankDetailsSchema.safeParse(payoutDetailsJson);
		if (!payoutDetailsParsed.success) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
				message: payoutDetailsParsed.error.issues[0]?.message ?? 'Invalid payout details',
			});
		}

		const [recipient] = await tx
			.select({
				id: users.id,
				email: users.email,
				firstName: users.firstName,
				lastName: users.lastName,
				bankingCustomerId: users.bankingCustomerId,
			})
			.from(users)
			.where(eq(users.email, req.recipientEmail))
			.limit(1);
		if (!recipient?.id || !recipient.bankingCustomerId)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient is not ready for payout' });

		const [kyc] = await tx
			.select({
				firstName: bankingCustomerKyc.firstName,
				lastName: bankingCustomerKyc.lastName,
				customerType: bankingCustomerKyc.customerType,
			})
			.from(bankingCustomerKyc)
			.where(eq(bankingCustomerKyc.userId, recipient.id))
			.limit(1);

		const [address] = await tx
			.select({
				streetLine1: bankingCustomerAddresses.streetLine1,
				city: bankingCustomerAddresses.city,
				postalCode: bankingCustomerAddresses.postalCode,
				country: bankingCustomerAddresses.country,
				state: bankingCustomerAddresses.state,
			})
			.from(bankingCustomerAddresses)
			.where(eq(bankingCustomerAddresses.userId, recipient.id))
			.limit(1);

		const accountHolderFirstName = kyc?.firstName ?? recipient.firstName;
		const accountHolderLastName = kyc?.lastName ?? recipient.lastName;
		if (!accountHolderFirstName || !accountHolderLastName)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient legal name missing' });
		if (!address?.streetLine1 || !address.city || !address.postalCode || !address.country || !address.state)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient address missing' });

		const accountHolderType: DestinationBankAccount['account_holder_type'] =
			kyc?.customerType === 'individual' || !kyc?.customerType ? 'individual' : 'business';

		const destinationPaymentRails: PaymentRail = getPayRequestOfframpPaymentRail(payoutDetailsParsed.data);
		const destinationCurrency: FiatCurrency = getPayRequestOfframpDestinationCurrency(req);

		const destinationAmount = atomicToDecimalString(req.amountAtomic, req.payoutCurrency);

		const destinationBankAccount = createOfframpDestinationBankAccount({
			bankDetails: payoutDetailsParsed.data,
			accountHolderType,
			accountHolderFirstName,
			accountHolderLastName,
			accountHolderAddress: {
				country: address.country,
				city: address.city,
				street_line_1: address.streetLine1,
				postal_code: address.postalCode,
				state: address.state,
			},
		});

		const transferPurpose: TransferPurpose = parseTransferPurpose(req.transferPurpose);

		await tx.update(bankingPayRequests).set({ status: 'processing' }).where(eq(bankingPayRequests.id, req.id));

		return {
			handled: false,
			senderUserId: sender.id,
			senderCustomerId: sender.bankingCustomerId,
			recipientUserId: recipient.id,
			recipientPaymentRails: destinationPaymentRails,
			destinationCurrency,
			destinationAmount,
			destinationBankAccount,
			transferPurpose,
			amountAtomic: req.amountAtomic,
			sourceCurrency: req.sourceCurrency,
			payoutCurrency: req.payoutCurrency,
		};
	});

	if (prepared.handled) return { handled: true };

	const align = getAlignClient();
	const quote = await align.transfers.createOfframpQuote(prepared.senderCustomerId, {
		destination_amount: prepared.destinationAmount,
		source_token: DEFAULT_ALIGN_DESTINATION_TOKEN,
		source_network: DEFAULT_WALLET_NETWORK,
		destination_currency: prepared.destinationCurrency,
		destination_payment_rails: prepared.recipientPaymentRails,
	});

	const transfer = await align.transfers.createOfframpTransfer(prepared.senderCustomerId, quote.quote_id, {
		transfer_purpose: prepared.transferPurpose,
		destination_bank_account: prepared.destinationBankAccount,
	});

	const { depositAddress, depositAmountDecimal } = getOfframpDepositDetailsFromTransfer(transfer);
	const depositAmountAtomic = decimalStringToStableAtomic({
		amountDecimal: depositAmountDecimal,
		currency: SUPPORTED_STABLE_CURRENCIES.usdc,
	});

	const session = await getActiveWalletSessionForUser({ userId: prepared.senderUserId });
	const tokenAddress = USDC_BY_CHAIN[CHAIN_IDS.POLYGON_POS];
	const { txHash } = await sendErc20TransferWithSessionKey({
		chainId: session.chainId,
		smartAccountAddress: session.smartAccountAddress,
		sessionKeyAddress: session.sessionKeyAddress,
		tokenAddress,
		to: depositAddress,
		amount: depositAmountAtomic,
	});

	await align.transfers.completeOfframpTransfer(prepared.senderCustomerId, transfer.id, { deposit_transaction_hash: txHash });

	await db.transaction(async (tx) => {
		await tx
			.update(bankingPayRequests)
			.set({ providerTransferId: transfer.id, providerTxHash: txHash })
			.where(eq(bankingPayRequests.id, params.payRequestId));

		await createProviderTransferMapping({
			tx,
			userId: prepared.senderUserId,
			amountAtomic: prepared.amountAtomic,
			currency: prepared.payoutCurrency,
			rail: prepared.recipientPaymentRails,
			provider: BANKING_PROVIDERS.ALIGN,
			providerTransferId: transfer.id,
			providerTxHash: txHash,
			referenceType: 'pay_request',
			referenceId: params.payRequestId,
			status: 'pending',
			payload: null,
		});

		await createUserActivityTransaction({
			tx,
			userId: prepared.senderUserId,
			type: 'transfer_out',
			direction: 'debit',
			status: 'pending',
			amountAtomic: prepared.amountAtomic,
			currency: prepared.sourceCurrency,
			rail: null,
			referenceType: 'pay_request',
			referenceId: params.payRequestId,
			description: `Pay request ${params.payRequestId}`,
			category: 'transfer',
			createdAt: dayjs().toDate(),
		});

		await createUserActivityTransaction({
			tx,
			userId: prepared.recipientUserId,
			type: 'transfer_in',
			direction: 'credit',
			status: 'pending',
			amountAtomic: prepared.amountAtomic,
			currency: prepared.payoutCurrency,
			rail: null,
			referenceType: 'pay_request',
			referenceId: params.payRequestId,
			description: `Pay request ${params.payRequestId}`,
			category: 'transfer',
			createdAt: dayjs().toDate(),
		});
	});

	return { handled: true };
}
