import getAlignClient from '@/core/clients/align';
import { and, eq } from '@brioela/shared/drizzle';
import { bankingLedgerHolds, bankingPayRequests, users } from '@brioela/shared/drizzle/schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { captureHold, releaseHold } from '@/api/banking/helpers/ledger';
import type { Tx } from '@/api/banking/helpers/ledger/types';
import dayjs from 'dayjs';
import { finalizeReferenceTransactionsCompleted } from '@/api/banking/helpers/transactions/finalize-reference-transactions-completed';
import { finalizeReferenceTransactionsFailed } from '@/api/banking/helpers/transactions/finalize-reference-transactions-failed';

export async function finalizePayRequestOfframpTransfer(params: { tx: Tx; payRequestId: string; transferId: string }) {
	const [req] = await params.tx.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, params.payRequestId)).limit(1);

	if (!req) return { handled: true };

	if (req.status === 'completed' || req.status === 'failed') return { handled: true };

	const [sender] = await params.tx
		.select({ bankingCustomerId: users.bankingCustomerId })
		.from(users)
		.where(eq(users.id, req.senderUserId))
		.limit(1);
	if (!sender?.bankingCustomerId) return { handled: true };

	const align = getAlignClient();
	const transfer = await align.transfers.getOfframpTransfer(sender.bankingCustomerId, params.transferId);

	const [hold] = await params.tx
		.select()
		.from(bankingLedgerHolds)
		.where(
			and(eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.PAY_REQUEST), eq(bankingLedgerHolds.referenceId, req.id))
		)
		.limit(1);

	if (transfer.status === 'completed') {
		await params.tx
			.update(bankingPayRequests)
			.set({ status: 'completed', completedAt: dayjs().toDate() })
			.where(eq(bankingPayRequests.id, req.id));

		if (hold?.status === 'active') {
			await captureHold({
				tx: params.tx,
				holdId: hold.id,
				userId: req.senderUserId,
				reason: `Capture for payout ${req.id}`,
			});
		}

		await finalizeReferenceTransactionsCompleted({
			tx: params.tx,
			referenceType: 'pay_request',
			referenceId: req.id,
			settledAt: dayjs().toDate(),
		});

		return { handled: true };
	}

	if (transfer.status === 'failed') {
		await params.tx
			.update(bankingPayRequests)
			.set({
				status: 'failed',
				failedAt: dayjs().toDate(),
				failureReason: 'Provider transfer failed',
			})
			.where(eq(bankingPayRequests.id, req.id));

		if (hold?.status === 'active') {
			await releaseHold({
				tx: params.tx,
				holdId: hold.id,
				userId: req.senderUserId,
				reason: `Failed payout ${req.id}`,
			});
		}

		await finalizeReferenceTransactionsFailed({
			tx: params.tx,
			referenceType: 'pay_request',
			referenceId: req.id,
		});
	}

	return { handled: true };
}
