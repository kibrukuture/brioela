import getAlignClient from '@/core/clients/align';
import { and, eq } from '@schnl/shared/drizzle';
import { bankingCardOrders, bankingCards, bankingLedgerHolds, users } from '@schnl/shared/drizzle/schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';
import { captureHold, releaseHold } from '@/api/banking/helpers/ledger';
import type { Tx } from '@/api/banking/helpers/ledger/types';
import dayjs from 'dayjs';
import { finalizeReferenceTransactionsCompleted } from '@/api/banking/helpers/transactions/finalize-reference-transactions-completed';
import { finalizeReferenceTransactionsFailed } from '@/api/banking/helpers/transactions/finalize-reference-transactions-failed';
import { createCardMetadata } from '@/api/cards/helpers/create-card-metadata';

export async function finalizeCardOrderOfframpTransfer(params: { tx: Tx; orderId: string; transferId: string }) {
	const [order] = await params.tx.select().from(bankingCardOrders).where(eq(bankingCardOrders.id, params.orderId)).limit(1);

	if (!order) return { handled: true };
	if (order.status === 'completed' || order.status === 'failed') return { handled: true };

	const [sender] = await params.tx
		.select({ bankingCustomerId: users.bankingCustomerId })
		.from(users)
		.where(eq(users.id, order.userId))
		.limit(1);
	if (!sender?.bankingCustomerId) return { handled: true };

	const align = getAlignClient();
	const transfer = await align.transfers.getOfframpTransfer(sender.bankingCustomerId, params.transferId);

	const [hold] = await params.tx
		.select()
		.from(bankingLedgerHolds)
		.where(
			and(
				eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.CARD_ORDER),
				eq(bankingLedgerHolds.referenceId, order.id)
			)
		)
		.limit(1);

	if (transfer.status === 'completed') {
		const now = dayjs().toDate();

		if (hold?.status === 'active') {
			await captureHold({
				tx: params.tx,
				holdId: hold.id,
				userId: order.userId,
				reason: `Capture for card order ${order.id}`,
			});
		}

		const { last4, expiryMonth, expiryYear } = createCardMetadata();
		const status = order.type === 'virtual' ? 'active' : 'pending';
		const cardId = order.cardId;
		if (cardId) {
			await params.tx
				.update(bankingCards)
				.set({
					status,
					last4,
					expiryMonth,
					expiryYear,
					updatedAt: now,
				})
				.where(eq(bankingCards.id, cardId));
		} else {
			const [card] = await params.tx
				.insert(bankingCards)
				.values({
					userId: order.userId,
					providerId: `card_order:${order.id}`,
					type: order.type,
					status,
					brand: 'mastercard',
					last4,
					expiryMonth,
					expiryYear,
					currency: 'usd',
					walletAddress: null,
					label: null,
					theme: null,
					updatedAt: now,
				})
				.returning();

			await params.tx
				.update(bankingCardOrders)
				.set({ cardId: card?.id ?? null, updatedAt: now })
				.where(eq(bankingCardOrders.id, order.id));
		}

		await params.tx
			.update(bankingCardOrders)
			.set({
				status: order.type === 'virtual' ? 'completed' : 'preparing',
				updatedAt: now,
			})
			.where(eq(bankingCardOrders.id, order.id));

		await finalizeReferenceTransactionsCompleted({
			tx: params.tx,
			referenceType: 'card_order',
			referenceId: order.id,
			settledAt: now,
		});

		return { handled: true };
	}

	if (transfer.status === 'failed') {
		const now = dayjs().toDate();

		await params.tx.update(bankingCardOrders).set({ status: 'failed', updatedAt: now }).where(eq(bankingCardOrders.id, order.id));

		if (hold?.status === 'active') {
			await releaseHold({
				tx: params.tx,
				holdId: hold.id,
				userId: order.userId,
				reason: `Failed card order ${order.id}`,
			});
		}

		await finalizeReferenceTransactionsFailed({
			tx: params.tx,
			referenceType: 'card_order',
			referenceId: order.id,
		});
	}

	return { handled: true };
}
