import getAlignClient from '@/core/clients/align';
import { and, eq } from '@brioela/shared/drizzle';
import { bankingLedgerHolds, bankingPeerToPeerTransfers, users } from '@brioela/shared/drizzle/schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { captureHold, releaseHold } from '@/api/banking/helpers/ledger';
import type { Tx } from '@/api/banking/helpers/ledger/types';
import dayjs from 'dayjs';
import { finalizeReferenceTransactionsCompleted } from '@/api/banking/helpers/transactions/finalize-reference-transactions-completed';
import { finalizeReferenceTransactionsFailed } from '@/api/banking/helpers/transactions/finalize-reference-transactions-failed';

export async function finalizePeerToPeerOfframpTransfer(params: { tx: Tx; peerToPeerTransferId: string; transferId: string }) {
	const [p2p] = await params.tx
		.select()
		.from(bankingPeerToPeerTransfers)
		.where(eq(bankingPeerToPeerTransfers.id, params.peerToPeerTransferId))
		.limit(1);

	if (!p2p) return { handled: true };
	if (p2p.status === 'completed' || p2p.status === 'failed') return { handled: true };

	const [sender] = await params.tx
		.select({ bankingCustomerId: users.bankingCustomerId })
		.from(users)
		.where(eq(users.id, p2p.senderUserId))
		.limit(1);
	if (!sender?.bankingCustomerId) return { handled: true };

	const align = getAlignClient();
	const transfer = await align.transfers.getOfframpTransfer(sender.bankingCustomerId, params.transferId);

	const [hold] = await params.tx
		.select()
		.from(bankingLedgerHolds)
		.where(
			and(
				eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.PEER_TO_PEER),
				eq(bankingLedgerHolds.referenceId, p2p.id)
			)
		)
		.limit(1);

	if (transfer.status === 'completed') {
		await params.tx
			.update(bankingPeerToPeerTransfers)
			.set({ status: 'completed', completedAt: dayjs().toDate(), updatedAt: dayjs().toDate() })
			.where(eq(bankingPeerToPeerTransfers.id, p2p.id));

		if (hold?.status === 'active') {
			await captureHold({
				tx: params.tx,
				holdId: hold.id,
				userId: p2p.senderUserId,
				reason: `Capture for peer to peer transfer ${p2p.id}`,
			});
		}

		await finalizeReferenceTransactionsCompleted({
			tx: params.tx,
			referenceType: 'peer_to_peer',
			referenceId: p2p.id,
			settledAt: dayjs().toDate(),
		});

		return { handled: true };
	}

	if (transfer.status === 'failed') {
		await params.tx
			.update(bankingPeerToPeerTransfers)
			.set({ status: 'failed', failedAt: dayjs().toDate(), failureReason: 'Provider transfer failed', updatedAt: dayjs().toDate() })
			.where(eq(bankingPeerToPeerTransfers.id, p2p.id));

		if (hold?.status === 'active') {
			await releaseHold({
				tx: params.tx,
				holdId: hold.id,
				userId: p2p.senderUserId,
				reason: `Failed peer to peer transfer ${p2p.id}`,
			});
		}

		await finalizeReferenceTransactionsFailed({
			tx: params.tx,
			referenceType: 'peer_to_peer',
			referenceId: p2p.id,
		});
	}

	return { handled: true };
}
