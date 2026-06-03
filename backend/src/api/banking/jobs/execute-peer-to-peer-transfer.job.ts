import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { and, eq } from '@schnl/shared/drizzle';
import { bankingLedgerHolds, bankingOfframpOutbox, bankingPeerToPeerTransfers, users } from '@schnl/shared/drizzle/schema';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { executePeerToPeerTransferJobSchema } from '@schnl/shared/validators/peer-to-peer-transfer.validator';
import { parseAmountAtomic } from '@schnl/shared/utils/money';
import dayjs from 'dayjs';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';
import { publishOfframpOutboxQueueJob } from '@/api/banking/helpers/offramp-outbox/publish-offramp-outbox-queue-job';

export async function executePeerToPeerTransferJob(c: AppContext) {
	const body = await c.req.json();
	const parsed = executePeerToPeerTransferJobSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, {
			message: parsed.error.issues[0]?.message ?? 'Invalid payload',
		});
	}

	const payload = parsed.data;
	const db = getDb();
	const outbox = await db.transaction(async (tx) => {
		const [transfer] = await tx
			.select()
			.from(bankingPeerToPeerTransfers)
			.where(eq(bankingPeerToPeerTransfers.id, payload.transferId))
			.limit(1);

		if (!transfer) return;

		if (transfer.status === 'completed' || transfer.status === 'failed') return;
		if (transfer.providerTransferId) return;

		const senderUserId = transfer.senderUserId;
		const recipientUserId = transfer.recipientUserId;
		if (!senderUserId || !recipientUserId) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Missing sender or recipient' });
		}

		const amountAtomic = parseAmountAtomic(String(transfer.amountAtomic));
		if (amountAtomic <= 0n) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Invalid amount' });
		}

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
		if (hold.userId !== senderUserId) {
			throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
		}
		if (hold.status !== 'active') {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold is not active' });
		}
		if (hold.expiresAt && dayjs(hold.expiresAt).isBefore(dayjs())) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold has expired' });
		}

		await tx
			.update(bankingPeerToPeerTransfers)
			.set({ status: 'in_flight', updatedAt: dayjs().toDate() })
			.where(eq(bankingPeerToPeerTransfers.id, transfer.id));

		const [outboxRow] = await tx
			.insert(bankingOfframpOutbox)
			.values({
				referenceType: 'peer_to_peer',
				referenceId: transfer.id,
				payload: {},
				dedupeKey: `peer_to_peer:${transfer.id}`,
			})
			.returning({ id: bankingOfframpOutbox.id });

		return outboxRow;
	});

	if (outbox?.id) {
		await publishOfframpOutboxQueueJob({ outboxId: outbox.id });
	}

	return c.json({ success: true });
}
