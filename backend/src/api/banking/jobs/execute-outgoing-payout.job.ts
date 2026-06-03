import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingLedgerHolds, bankingOfframpOutbox, bankingOutgoingPayouts, users } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import dayjs from 'dayjs';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { executeOutgoingPayoutJobSchema } from '@brioela/shared/validators/outgoing-payout.validator';
import { publishOfframpOutboxQueueJob } from '@/api/banking/helpers/offramp-outbox/publish-offramp-outbox-queue-job';

export async function executeOutgoingPayoutJob(c: AppContext) {
	const body = await c.req.json();
	const parsed = executeOutgoingPayoutJobSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, { message: parsed.error.issues[0]?.message ?? 'Invalid payload' });
	}
	const payload = parsed.data;
	const payloadTransferPurpose = payload.transferPurpose;

	const db = getDb();
	const outbox = await db.transaction(async (tx) => {
		const [payout] = await tx.select().from(bankingOutgoingPayouts).where(eq(bankingOutgoingPayouts.id, payload.payoutId)).limit(1);
		if (!payout) return;
		if (payout.status !== 'created' && payout.status !== 'processing') return;
		if (payout.providerTransferId) return;

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
		if (!hold) {
			throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Hold not found' });
		}
		if (hold.userId !== sender.id) {
			throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
		}
		if (hold.status !== 'active') {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold is not active' });
		}
		if (hold.expiresAt && dayjs(hold.expiresAt).isBefore(dayjs())) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold has expired' });
		}

		await tx
			.update(bankingOutgoingPayouts)
			.set({ status: 'in_flight', updatedAt: dayjs().toDate() })
			.where(eq(bankingOutgoingPayouts.id, payout.id));

		const [outboxRow] = await tx
			.insert(bankingOfframpOutbox)
			.values({
				referenceType: 'outgoing_payout',
				referenceId: payout.id,
				payload: { transferPurpose: payloadTransferPurpose },
				dedupeKey: `outgoing_payout:${payout.id}`,
			})
			.returning({ id: bankingOfframpOutbox.id });

		return outboxRow;
	});

	if (outbox?.id) {
		await publishOfframpOutboxQueueJob({ outboxId: outbox.id });
	}

	return c.json({ success: true });
}
