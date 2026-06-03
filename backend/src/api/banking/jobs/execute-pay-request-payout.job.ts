import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingLedgerHolds, bankingOfframpOutbox, bankingPayRequests, users } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { executePayRequestPayoutJobPayloadSchema } from '@brioela/shared/validators/pay-request.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import dayjs from 'dayjs';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { publishOfframpOutboxQueueJob } from '@/api/banking/helpers/offramp-outbox/publish-offramp-outbox-queue-job';

export async function executePayRequestPayoutJob(c: AppContext) {
	const body = await c.req.json();
	const parsed = executePayRequestPayoutJobPayloadSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, {
			message: parsed.error.issues[0]?.message ?? 'Invalid payload',
		});
	}

	const payload = parsed.data;
	const db = getDb();
	const outbox = await db.transaction(async (tx) => {
		const [req] = await tx.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, payload.payRequestId)).limit(1);
		if (!req) return;
		if (req.status !== 'processing' && req.status !== 'in_flight') return;
		if (req.providerTransferId) return;

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
		if (!recipient?.id || !recipient.bankingCustomerId) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Recipient is not ready for payout' });
		}

		const [sender] = await tx
			.select({ id: users.id, bankingCustomerId: users.bankingCustomerId, bankingKycStatus: users.bankingKycStatus })
			.from(users)
			.where(eq(users.id, req.senderUserId))
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
					eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.PAY_REQUEST),
					eq(bankingLedgerHolds.referenceId, req.id)
				)
			)
			.limit(1);
		if (!hold) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Hold not found' });
		if (hold.userId !== sender.id) {
			throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
		}
		if (hold.status !== 'active') {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold is not active' });
		}
		if (hold.expiresAt && dayjs(hold.expiresAt).isBefore(dayjs())) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold has expired' });
		}

		await tx.update(bankingPayRequests).set({ status: 'in_flight' }).where(eq(bankingPayRequests.id, req.id));

		const [outboxRow] = await tx
			.insert(bankingOfframpOutbox)
			.values({
				referenceType: 'pay_request',
				referenceId: req.id,
				payload: {},
				dedupeKey: `pay_request:${req.id}`,
			})
			.returning({ id: bankingOfframpOutbox.id });

		return outboxRow;
	});

	if (outbox?.id) {
		await publishOfframpOutboxQueueJob({ outboxId: outbox.id });
	}

	return c.json({ success: true });
}
