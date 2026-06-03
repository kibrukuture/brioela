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
	bankingPeerToPeerTransfers,
	bankingVirtualAccounts,
	users,
} from '@schnl/shared/drizzle/schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';
import { BANKING_PROVIDERS } from '@schnl/shared/constants/banking-providers';
import { DEFAULT_ALIGN_DESTINATION_TOKEN, DEFAULT_WALLET_NETWORK } from '@schnl/shared/constants';
import type { DestinationBankAccount, FiatCurrency, PaymentRail } from '@tolbel/align';
import { BankingCurrency } from '@schnl/shared/drizzle/schema/banking-enums.schema';
import { atomicToDecimalString, parseAmountAtomic } from '@schnl/shared/utils/money';
import { parseTransferPurpose } from '@/api/banking/helpers/parsers/parse-transfer-purpose';
import type { TransferPurpose } from '@schnl/shared/constants/transfer-purposes';
import { createOfframpDestinationBankAccount } from '@/api/banking/helpers/payout/create-offramp-destination-bank-account';
import { getBankDetailsFromVirtualAccount } from '@/api/banking/helpers/peer-to-peer-transfers/get-bank-details-from-virtual-account';
import { getPeerToPeerOfframpPaymentRail } from '@/api/banking/helpers/offramp-outbox/peer-to-peer-transfers/get-peer-to-peer-offramp-payment-rail';
import { getPeerToPeerOfframpDestinationCurrency } from '@/api/banking/helpers/offramp-outbox/peer-to-peer-transfers/get-peer-to-peer-offramp-destination-currency';
import { createUserActivityTransaction } from '@/api/banking/helpers/transactions/create-user-activity-transaction';
import { createProviderTransferMapping } from '@/api/banking/helpers/transactions/create-provider-transfer-mapping';
import { getOfframpDepositDetailsFromTransfer } from '@/api/banking/helpers/align/get-offramp-deposit-details-from-transfer';
import { getActiveWalletSessionForUser } from '@/core/clients/thirdweb-utils/get-active-wallet-session-for-user';
import { decimalStringToStableAtomic } from '@/core/clients/thirdweb-utils/decimal-string-to-usdc-atomic';
import { sendErc20TransferWithSessionKey } from '@/core/clients/thirdweb-utils/send-erc20-transfer-with-session-key';
import { CHAIN_IDS, USDC_BY_CHAIN } from '@schnl/shared/constants';
import { SUPPORTED_STABLE_CURRENCIES } from '@schnl/shared/constants/supported-stable-currencies';
import { peerToPeerOfframpOutboxPayloadSchema } from '@schnl/shared/validators/offramp-outbox-payloads.validator';

type ExecutePeerToPeerOfframpPrepared =
	| { handled: true }
	| {
			handled: false;
			senderCustomerId: string;
			senderUserId: string;
			recipientUserId: string;
			amountAtomic: bigint;
			currency: (typeof BankingCurrency.enumValues)[number];
			destinationPaymentRails: PaymentRail;
			destinationCurrency: FiatCurrency;
			destinationAmount: string;
			destinationBankAccount: DestinationBankAccount;
			transferPurpose: TransferPurpose;
	  };

export async function executePeerToPeerOfframp(params: { transferId: string; payload: unknown }) {
	const db = getDb();

	const prepared: ExecutePeerToPeerOfframpPrepared = await db.transaction(async (tx) => {
		const [transfer] = await tx
			.select()
			.from(bankingPeerToPeerTransfers)
			.where(eq(bankingPeerToPeerTransfers.id, params.transferId))
			.limit(1);
		if (!transfer) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Transfer not found' });
		if (transfer.providerTransferId) return { handled: true };
		if (transfer.status === 'completed' || transfer.status === 'failed') return { handled: true };

		const senderUserId = transfer.senderUserId;
		const recipientUserId = transfer.recipientUserId;
		if (!senderUserId || !recipientUserId)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Missing sender or recipient' });

		const amountAtomic = parseAmountAtomic(String(transfer.amountAtomic));
		if (amountAtomic <= 0n) throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Invalid amount' });

		const [hold] = await tx
			.select()
			.from(bankingLedgerHolds)
			.where(
				and(
					eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.PEER_TO_PEER),
					eq(bankingLedgerHolds.referenceId, transfer.id)
				)
			)
			.limit(1);
		if (!hold) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Hold not found' });
		if (hold.userId !== senderUserId) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
		if (hold.status !== 'active') throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold is not active' });
		if (hold.expiresAt && dayjs(hold.expiresAt).isBefore(dayjs()))
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold has expired' });

		const payloadValidation = peerToPeerOfframpOutboxPayloadSchema.safeParse(params.payload);
		if (!payloadValidation.success) {
			throw new HTTPException(ErrorCode.BAD_REQUEST, { message: payloadValidation.error.issues[0]?.message ?? 'Invalid outbox payload' });
		}

		const [sender] = await tx
			.select({ id: users.id, bankingCustomerId: users.bankingCustomerId, bankingKycStatus: users.bankingKycStatus })
			.from(users)
			.where(eq(users.id, senderUserId))
			.limit(1);
		if (!sender?.id || !sender.bankingCustomerId)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Sender is not ready for transfer' });
		if (sender.bankingKycStatus !== 'approved')
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Sender KYC not approved' });

		const [recipient] = await tx
			.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
			.from(users)
			.where(eq(users.id, recipientUserId))
			.limit(1);
		if (!recipient?.id) throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient is not ready for transfer' });

		const [virtualAccount] = await tx
			.select()
			.from(bankingVirtualAccounts)
			.where(and(eq(bankingVirtualAccounts.userId, recipient.id), eq(bankingVirtualAccounts.currency, transfer.currency)))
			.limit(1);
		if (!virtualAccount)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient bank account missing for selected currency' });

		const [kyc] = await tx
			.select({
				firstName: bankingCustomerKyc.firstName,
				lastName: bankingCustomerKyc.lastName,
				customerType: bankingCustomerKyc.customerType,
			})
			.from(bankingCustomerKyc)
			.where(and(eq(bankingCustomerKyc.userId, recipient.id), eq(bankingCustomerKyc.provider, BANKING_PROVIDERS.ALIGN)))
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
			.where(and(eq(bankingCustomerAddresses.userId, recipient.id), eq(bankingCustomerAddresses.provider, BANKING_PROVIDERS.ALIGN)))
			.limit(1);

		const accountHolderFirstName = kyc?.firstName ?? recipient.firstName ?? '';
		const accountHolderLastName = kyc?.lastName ?? recipient.lastName ?? '';
		if (!accountHolderFirstName || !accountHolderLastName)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient legal name missing' });
		if (!address?.streetLine1 || !address.city || !address.postalCode || !address.country || !address.state)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient address missing' });

		const accountHolderType: DestinationBankAccount['account_holder_type'] =
			kyc?.customerType === 'individual' || !kyc?.customerType ? 'individual' : 'business';

		const bankDetails = getBankDetailsFromVirtualAccount({ virtualAccount });
		const destinationPaymentRails: PaymentRail = getPeerToPeerOfframpPaymentRail(bankDetails);
		const destinationCurrency: FiatCurrency = getPeerToPeerOfframpDestinationCurrency(transfer);

		const destinationAmount = atomicToDecimalString(amountAtomic, transfer.currency);
		const transferPurpose: TransferPurpose = parseTransferPurpose(transfer.transferPurpose);

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
			.update(bankingPeerToPeerTransfers)
			.set({ status: 'processing', updatedAt: dayjs().toDate() })
			.where(eq(bankingPeerToPeerTransfers.id, transfer.id));

		return {
			handled: false,
			senderCustomerId: sender.bankingCustomerId,
			senderUserId: sender.id,
			recipientUserId: recipient.id,
			amountAtomic,
			currency: transfer.currency,
			destinationPaymentRails,
			destinationCurrency,
			destinationAmount,
			destinationBankAccount,
			transferPurpose,
		};
	});

	if (prepared.handled) return { handled: true };

	const align = getAlignClient();
	const quote = await align.transfers.createOfframpQuote(prepared.senderCustomerId, {
		destination_amount: prepared.destinationAmount,
		source_token: DEFAULT_ALIGN_DESTINATION_TOKEN,
		source_network: DEFAULT_WALLET_NETWORK,
		destination_currency: prepared.destinationCurrency,
		destination_payment_rails: prepared.destinationPaymentRails,
	});

	const providerTransfer = await align.transfers.createOfframpTransfer(prepared.senderCustomerId, quote.quote_id, {
		transfer_purpose: prepared.transferPurpose,
		destination_bank_account: prepared.destinationBankAccount,
	});

	const { depositAddress, depositAmountDecimal } = getOfframpDepositDetailsFromTransfer(providerTransfer);
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

	await align.transfers.completeOfframpTransfer(prepared.senderCustomerId, providerTransfer.id, { deposit_transaction_hash: txHash });

	await db.transaction(async (tx) => {
		await tx
			.update(bankingPeerToPeerTransfers)
			.set({ providerTransferId: providerTransfer.id, providerTxHash: txHash, status: 'processing', updatedAt: dayjs().toDate() })
			.where(eq(bankingPeerToPeerTransfers.id, params.transferId));

		await createProviderTransferMapping({
			tx,
			userId: prepared.senderUserId,
			amountAtomic: prepared.amountAtomic,
			currency: prepared.currency,
			rail: prepared.destinationPaymentRails,
			provider: BANKING_PROVIDERS.ALIGN,
			providerTransferId: providerTransfer.id,
			providerTxHash: txHash,
			referenceType: 'peer_to_peer',
			referenceId: params.transferId,
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
			currency: prepared.currency,
			rail: prepared.destinationPaymentRails,
			referenceType: 'peer_to_peer',
			referenceId: params.transferId,
			description: `Peer to peer transfer ${params.transferId}`,
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
			currency: prepared.currency,
			rail: prepared.destinationPaymentRails,
			referenceType: 'peer_to_peer',
			referenceId: params.transferId,
			description: `Peer to peer transfer ${params.transferId}`,
			category: 'transfer',
			createdAt: dayjs().toDate(),
		});
	});

	return { handled: true };
}
