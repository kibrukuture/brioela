import dayjs from 'dayjs';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { getDb } from '@/core/database/client';
import getAlignClient from '@/core/clients/align';
import { and, eq } from '@schnl/shared/drizzle';
import {
	bankingCustomerAddresses,
	bankingCustomerKyc,
	bankingLedgerHolds,
	bankingOutgoingPayouts,
	users,
} from '@schnl/shared/drizzle/schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';
import { BANKING_PROVIDERS } from '@schnl/shared/constants/banking-providers';
import { DEFAULT_ALIGN_DESTINATION_TOKEN, DEFAULT_WALLET_NETWORK } from '@schnl/shared/constants';
import type { DestinationBankAccount, FiatCurrency, PaymentRail, TransferPurpose } from '@tolbel/align';
import { BankingCurrency } from '@schnl/shared/drizzle/schema/banking-enums.schema';
import { createOfframpDestinationBankAccount } from '@/api/banking/helpers/payout/create-offramp-destination-bank-account';
import { atomicToDecimalString } from '@schnl/shared/utils/money';
import { getOfframpDepositDetailsFromTransfer } from '@/api/banking/helpers/align/get-offramp-deposit-details-from-transfer';
import { getActiveWalletSessionForUser } from '@/core/clients/thirdweb-utils/get-active-wallet-session-for-user';
import { decimalStringToStableAtomic } from '@/core/clients/thirdweb-utils/decimal-string-to-usdc-atomic';
import { sendErc20TransferWithSessionKey } from '@/core/clients/thirdweb-utils/send-erc20-transfer-with-session-key';
import { CHAIN_IDS, USDC_BY_CHAIN } from '@schnl/shared/constants';
import { SUPPORTED_STABLE_CURRENCIES } from '@schnl/shared/constants/supported-stable-currencies';
import { getOutgoingPayoutOfframpBankDetails } from '@/api/banking/helpers/offramp-outbox/outgoing-payouts/get-outgoing-payout-offramp-bank-details';
import { getOutgoingPayoutOfframpTransferPurpose } from '@/api/banking/helpers/offramp-outbox/outgoing-payouts/get-outgoing-payout-offramp-transfer-purpose';
import { getOutgoingPayoutOfframpDestinationCurrency } from '@/api/banking/helpers/offramp-outbox/outgoing-payouts/get-outgoing-payout-offramp-destination-currency';
import { getOutgoingPayoutOfframpPaymentRail } from '@/api/banking/helpers/offramp-outbox/outgoing-payouts/get-outgoing-payout-offramp-payment-rail';
import { createUserActivityTransaction } from '@/api/banking/helpers/transactions/create-user-activity-transaction';
import { createProviderTransferMapping } from '@/api/banking/helpers/transactions/create-provider-transfer-mapping';
import { outgoingPayoutOfframpOutboxPayloadSchema } from '@schnl/shared/validators/offramp-outbox-payloads.validator';

export async function executeOutgoingPayoutOfframp(params: { payoutId: string; payload: unknown }) {
	const db = getDb();

	type Prepared =
		| { handled: true }
		| {
				handled: false;
				senderCustomerId: string;
				senderUserId: string;
				amountAtomic: bigint;
				currency: (typeof BankingCurrency.enumValues)[number];
				destinationPaymentRails: PaymentRail;
				destinationCurrency: FiatCurrency;
				destinationAmount: string;
				destinationBankAccount: DestinationBankAccount;
				transferPurpose: TransferPurpose;
		  };

	const prepared = await db.transaction(async (tx): Promise<Prepared> => {
		const [payout] = await tx.select().from(bankingOutgoingPayouts).where(eq(bankingOutgoingPayouts.id, params.payoutId)).limit(1);
		if (!payout) {
			throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Outgoing payout not found' });
		}
		if (payout.providerTransferId) {
			return { handled: true };
		}

		const [sender] = await tx
			.select({
				id: users.id,
				bankingCustomerId: users.bankingCustomerId,
				bankingKycStatus: users.bankingKycStatus,
				firstName: users.firstName,
				lastName: users.lastName,
			})
			.from(users)
			.where(eq(users.id, payout.userId))
			.limit(1);
		if (!sender?.id || !sender.bankingCustomerId) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Sender is not ready for payout' });
		}
		if (sender.bankingKycStatus !== 'approved') {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Sender KYC not approved' });
		}

		const [hold] = await tx
			.select()
			.from(bankingLedgerHolds)
			.where(
				and(
					eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.OUTGOING_PAYOUT),
					eq(bankingLedgerHolds.referenceId, payout.id)
				)
			)
			.limit(1);
		if (!hold) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Hold not found' });
		if (hold.userId !== sender.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
		if (hold.status !== 'active') throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold is not active' });
		if (hold.expiresAt && dayjs(hold.expiresAt).isBefore(dayjs())) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold has expired' });
		}

		const payloadValidation = outgoingPayoutOfframpOutboxPayloadSchema.safeParse(params.payload);
		if (!payloadValidation.success) {
			throw new HTTPException(ErrorCode.BAD_REQUEST, {
				message: payloadValidation.error.issues[0]?.message ?? 'Invalid outbox payload',
			});
		}

		const bankDetails = await getOutgoingPayoutOfframpBankDetails({ tx, payout });
		const transferPurpose: TransferPurpose = getOutgoingPayoutOfframpTransferPurpose({
			payout,
			payloadTransferPurpose: payloadValidation.data.transferPurpose,
		});

		const [kyc] = await tx
			.select({
				firstName: bankingCustomerKyc.firstName,
				lastName: bankingCustomerKyc.lastName,
				customerType: bankingCustomerKyc.customerType,
			})
			.from(bankingCustomerKyc)
			.where(eq(bankingCustomerKyc.userId, sender.id))
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
			.where(and(eq(bankingCustomerAddresses.userId, sender.id), eq(bankingCustomerAddresses.provider, BANKING_PROVIDERS.ALIGN)))
			.limit(1);

		if (!address?.streetLine1 || !address.city || !address.postalCode || !address.country || !address.state) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Sender address missing' });
		}

		const accountHolderType = kyc?.customerType === 'individual' || !kyc?.customerType ? 'individual' : 'business';

		const accountHolderFirstName = kyc?.firstName ?? sender.firstName ?? '';
		const accountHolderLastName = kyc?.lastName ?? sender.lastName ?? '';
		if (!accountHolderFirstName || !accountHolderLastName) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Sender legal name missing' });
		}

		const destinationPaymentRails = getOutgoingPayoutOfframpPaymentRail(bankDetails);
		const destinationCurrency = getOutgoingPayoutOfframpDestinationCurrency(payout);

		const destinationAmount = atomicToDecimalString(payout.amountAtomic, payout.currency);

		const destinationBankAccount = createOfframpDestinationBankAccount({
			bankDetails,
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

		await tx
			.update(bankingOutgoingPayouts)
			.set({ status: 'processing', updatedAt: dayjs().toDate() })
			.where(eq(bankingOutgoingPayouts.id, payout.id));

		return {
			handled: false,
			senderCustomerId: sender.bankingCustomerId,
			senderUserId: sender.id,
			amountAtomic: payout.amountAtomic,
			currency: payout.currency,
			destinationPaymentRails,
			destinationCurrency,
			destinationAmount,
			destinationBankAccount,
			transferPurpose,
		};
	});

	if (prepared.handled) {
		return { handled: true };
	}

	const {
		senderCustomerId,
		senderUserId,
		amountAtomic,
		currency,
		destinationPaymentRails,
		destinationCurrency,
		destinationAmount,
		destinationBankAccount,
		transferPurpose,
	} = prepared;

	const align = getAlignClient();
	const quote = await align.transfers.createOfframpQuote(senderCustomerId, {
		destination_amount: destinationAmount,
		source_token: DEFAULT_ALIGN_DESTINATION_TOKEN,
		source_network: DEFAULT_WALLET_NETWORK,
		destination_currency: destinationCurrency,
		destination_payment_rails: destinationPaymentRails,
	});

	const transfer = await align.transfers.createOfframpTransfer(senderCustomerId, quote.quote_id, {
		transfer_purpose: transferPurpose,
		destination_bank_account: destinationBankAccount,
	});

	const { depositAddress, depositAmountDecimal } = getOfframpDepositDetailsFromTransfer(transfer);
	const depositAmountAtomic = decimalStringToStableAtomic({
		amountDecimal: depositAmountDecimal,
		currency: SUPPORTED_STABLE_CURRENCIES.usdc,
	});

	const session = await getActiveWalletSessionForUser({ userId: senderUserId });
	if (session.chainId !== CHAIN_IDS.POLYGON_POS) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Offramp requires Polygon PoS' });
	}
	const tokenAddress = USDC_BY_CHAIN[CHAIN_IDS.POLYGON_POS];
	const { txHash } = await sendErc20TransferWithSessionKey({
		chainId: session.chainId,
		smartAccountAddress: session.smartAccountAddress,
		sessionKeyAddress: session.sessionKeyAddress,
		tokenAddress,
		to: depositAddress,
		amount: depositAmountAtomic,
	});

	await align.transfers.completeOfframpTransfer(senderCustomerId, transfer.id, { deposit_transaction_hash: txHash });

	await db.transaction(async (tx) => {
		await tx
			.update(bankingOutgoingPayouts)
			.set({ providerTransferId: transfer.id, providerTxHash: txHash, status: 'processing', updatedAt: dayjs().toDate() })
			.where(eq(bankingOutgoingPayouts.id, params.payoutId));

		await createProviderTransferMapping({
			tx,
			userId: senderUserId,
			amountAtomic,
			currency,
			rail: destinationPaymentRails,
			provider: BANKING_PROVIDERS.ALIGN,
			providerTransferId: transfer.id,
			providerTxHash: txHash,
			referenceType: 'outgoing_payout',
			referenceId: params.payoutId,
			status: 'pending',
			payload: null,
		});

		await createUserActivityTransaction({
			tx,
			userId: senderUserId,
			type: 'withdrawal',
			direction: 'debit',
			status: 'pending',
			amountAtomic,
			currency,
			rail: destinationPaymentRails,
			referenceType: 'outgoing_payout',
			referenceId: params.payoutId,
			description: `Outgoing payout ${params.payoutId}`,
			createdAt: dayjs().toDate(),
		});
	});

	return { handled: true };
}
