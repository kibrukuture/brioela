import getAlignClient from '@/core/clients/align';
import { and, eq } from '@schnl/shared/drizzle';
import { bankingLedgerHolds, bankingOutgoingPayouts, users } from '@schnl/shared/drizzle/schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';
import { captureHold, releaseHold } from '@/api/banking/helpers/ledger';
import type { Tx } from '@/api/banking/helpers/ledger/types';
import dayjs from 'dayjs';
import { finalizeReferenceTransactionsCompleted } from '@/api/banking/helpers/transactions/finalize-reference-transactions-completed';
import { finalizeReferenceTransactionsFailed } from '@/api/banking/helpers/transactions/finalize-reference-transactions-failed';

export async function finalizeOutgoingPayoutOfframpTransfer(params: { tx: Tx; payoutId: string; transferId: string }) {
	const [outgoing] = await params.tx.select().from(bankingOutgoingPayouts).where(eq(bankingOutgoingPayouts.id, params.payoutId)).limit(1);

	if (!outgoing) return { handled: true };

	if (outgoing.status === 'completed' || outgoing.status === 'failed') return { handled: true };

	const [sender] = await params.tx
		.select({ bankingCustomerId: users.bankingCustomerId })
		.from(users)
		.where(eq(users.id, outgoing.userId))
		.limit(1);
	if (!sender?.bankingCustomerId) return { handled: true };

	const align = getAlignClient();
	const transfer = await align.transfers.getOfframpTransfer(sender.bankingCustomerId, params.transferId);

	const [hold] = await params.tx
		.select()
		.from(bankingLedgerHolds)
		.where(
			and(
				eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.OUTGOING_PAYOUT),
				eq(bankingLedgerHolds.referenceId, outgoing.id)
			)
		)
		.limit(1);

	if (transfer.status === 'completed') {
		await params.tx
			.update(bankingOutgoingPayouts)
			.set({ status: 'completed', updatedAt: dayjs().toDate() })
			.where(eq(bankingOutgoingPayouts.id, outgoing.id));

		if (hold?.status === 'active') {
			await captureHold({
				tx: params.tx,
				holdId: hold.id,
				userId: outgoing.userId,
				reason: `Capture for outgoing payout ${outgoing.id}`,
			});
		}

		await finalizeReferenceTransactionsCompleted({
			tx: params.tx,
			referenceType: 'outgoing_payout',
			referenceId: outgoing.id,
			settledAt: dayjs().toDate(),
		});

		return { handled: true };
	}

	if (transfer.status === 'failed') {
		await params.tx
			.update(bankingOutgoingPayouts)
			.set({ status: 'failed', updatedAt: dayjs().toDate() })
			.where(eq(bankingOutgoingPayouts.id, outgoing.id));

		if (hold?.status === 'active') {
			await releaseHold({
				tx: params.tx,
				holdId: hold.id,
				userId: outgoing.userId,
				reason: `Failed outgoing payout ${outgoing.id}`,
			});
		}

		await finalizeReferenceTransactionsFailed({
			tx: params.tx,
			referenceType: 'outgoing_payout',
			referenceId: outgoing.id,
		});
	}

	return { handled: true };
}
