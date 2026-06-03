import dayjs from 'dayjs';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { getDb } from '@/core/database/client';
import getAlignClient from '@/core/clients/align';
import { and, eq } from '@brioela/shared/drizzle';
import { bankingCardOrders, bankingLedgerHolds, users } from '@brioela/shared/drizzle/schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { DEFAULT_ALIGN_DESTINATION_TOKEN, DEFAULT_WALLET_NETWORK } from '@brioela/shared/constants';
import type { FiatCurrency, PaymentRail, TransferPurpose } from '@tolbel/align';
import { atomicToDecimalString } from '@brioela/shared/utils/money';
import { getOfframpDepositDetailsFromTransfer } from '@/api/banking/helpers/align/get-offramp-deposit-details-from-transfer';
import { getActiveWalletSessionForUser } from '@/core/clients/thirdweb-utils/get-active-wallet-session-for-user';
import { decimalStringToStableAtomic } from '@/core/clients/thirdweb-utils/decimal-string-to-usdc-atomic';
import { sendErc20TransferWithSessionKey } from '@/core/clients/thirdweb-utils/send-erc20-transfer-with-session-key';
import { CHAIN_IDS, USDC_BY_CHAIN } from '@brioela/shared/constants';
import { SUPPORTED_STABLE_CURRENCIES } from '@brioela/shared/constants/supported-stable-currencies';
import { createUserActivityTransaction } from '@/api/banking/helpers/transactions/create-user-activity-transaction';
import { createProviderTransferMapping } from '@/api/banking/helpers/transactions/create-provider-transfer-mapping';
import { BANKING_PROVIDERS } from '@brioela/shared/constants/banking-providers';
import { createSchnlUsdDestinationBankAccount } from '@/api/cards/helpers/create-schnl-usd-destination-bank-account';

export async function executeCardOrderOfframp(params: { orderId: string; payload: unknown }) {
	const db = getDb();

	type Prepared =
		| { handled: true }
		| {
				handled: false;
				senderCustomerId: string;
				senderUserId: string;
				amountAtomic: bigint;
				destinationPaymentRails: PaymentRail;
				destinationCurrency: FiatCurrency;
				destinationAmount: string;
				transferPurpose: TransferPurpose;
		  };

	const prepared = await db.transaction(async (tx): Promise<Prepared> => {
		const [order] = await tx.select().from(bankingCardOrders).where(eq(bankingCardOrders.id, params.orderId)).limit(1);
		if (!order) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Card order not found' });
		if (order.providerTransferId) return { handled: true };
		if (order.status === 'completed' || order.status === 'failed') return { handled: true };

		const [sender] = await tx
			.select({ id: users.id, bankingCustomerId: users.bankingCustomerId, bankingKycStatus: users.bankingKycStatus })
			.from(users)
			.where(eq(users.id, order.userId))
			.limit(1);
		if (!sender?.id || !sender.bankingCustomerId) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'User is not ready for card order' });
		}
		if (sender.bankingKycStatus !== 'approved') {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'User KYC not approved' });
		}

		const [hold] = await tx
			.select()
			.from(bankingLedgerHolds)
			.where(
				and(
					eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.CARD_ORDER),
					eq(bankingLedgerHolds.referenceId, order.id)
				)
			)
			.limit(1);
		if (!hold) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Hold not found' });
		if (hold.userId !== sender.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
		if (hold.status !== 'active') throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold is not active' });
		if (hold.expiresAt && dayjs(hold.expiresAt).isBefore(dayjs())) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold has expired' });
		}

		await tx.update(bankingCardOrders).set({ status: 'processing', updatedAt: dayjs().toDate() }).where(eq(bankingCardOrders.id, order.id));

		const destinationPaymentRails: PaymentRail = 'ach';
		const destinationCurrency: FiatCurrency = 'usd';
		const destinationAmount = atomicToDecimalString(order.amountAtomic, 'usd');
		const transferPurpose: TransferPurpose = 'corporate_card';

		return {
			handled: false,
			senderCustomerId: sender.bankingCustomerId,
			senderUserId: sender.id,
			amountAtomic: BigInt(String(order.amountAtomic)),
			destinationPaymentRails,
			destinationCurrency,
			destinationAmount,
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

	const destinationBankAccount = createSchnlUsdDestinationBankAccount();
	const transfer = await align.transfers.createOfframpTransfer(prepared.senderCustomerId, quote.quote_id, {
		transfer_purpose: prepared.transferPurpose,
		destination_bank_account: destinationBankAccount,
	});

	const { depositAddress, depositAmountDecimal } = getOfframpDepositDetailsFromTransfer(transfer);
	const depositAmountAtomic = decimalStringToStableAtomic({
		amountDecimal: depositAmountDecimal,
		currency: SUPPORTED_STABLE_CURRENCIES.usdc,
	});

	const session = await getActiveWalletSessionForUser({ userId: prepared.senderUserId });
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

	await align.transfers.completeOfframpTransfer(prepared.senderCustomerId, transfer.id, { deposit_transaction_hash: txHash });

	await db.transaction(async (tx) => {
		await tx
			.update(bankingCardOrders)
			.set({ providerTransferId: transfer.id, providerTxHash: txHash, status: 'processing', updatedAt: dayjs().toDate() })
			.where(eq(bankingCardOrders.id, params.orderId));

		await createProviderTransferMapping({
			tx,
			userId: prepared.senderUserId,
			amountAtomic: prepared.amountAtomic,
			currency: 'usd',
			rail: prepared.destinationPaymentRails,
			provider: BANKING_PROVIDERS.ALIGN,
			providerTransferId: transfer.id,
			providerTxHash: txHash,
			referenceType: 'card_order',
			referenceId: params.orderId,
			status: 'pending',
			payload: null,
		});

		await createUserActivityTransaction({
			tx,
			userId: prepared.senderUserId,
			type: 'fee',
			direction: 'debit',
			status: 'pending',
			amountAtomic: prepared.amountAtomic,
			currency: 'usd',
			rail: prepared.destinationPaymentRails,
			referenceType: 'card_order',
			referenceId: params.orderId,
			description: `Card order fee ${params.orderId}`,
			category: 'card_fees',
			createdAt: dayjs().toDate(),
		});
	});

	return { handled: true };
}
