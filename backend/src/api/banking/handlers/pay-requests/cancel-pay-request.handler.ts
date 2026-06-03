import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingPayRequests, bankingLedgerHolds } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import dayjs from 'dayjs';
import { releaseHold } from '@/api/banking/helpers/ledger';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { payRequestIdParamSchema } from '@brioela/shared/validators/pay-request.validator';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { finalizeReferenceTransactionsFailed } from '@/api/banking/helpers/transactions/finalize-reference-transactions-failed';

export async function cancelPayRequest(c: AppContext) {
	const user = c.get('user');
	if (!user)
		throw new HTTPException(ErrorCode.UNAUTHORIZED, {
			message: 'Unauthorized',
		});
	const idParsed = payRequestIdParamSchema.safeParse({ id: c.req.param('id') });
	if (!idParsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: idParsed.error.issues[0]?.message ?? 'Invalid pay request id',
		});
	}
	const id = idParsed.data.id;
	const db = getDb();

	return db.transaction(async (tx) => {
		const [req] = await tx.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, id)).limit(1);
		if (!req)
			throw new HTTPException(ErrorCode.NOT_FOUND, {
				message: 'Pay request not found',
			});
		if (req.senderUserId !== user.id)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
				message: 'You are not the sender of this pay request',
			});
		if (req.status !== 'waiting_for_claim') {
			return { payRequestId: id, cancelled: false };
		}
		if (dayjs(req.expiresAt).isBefore(dayjs())) {
			return { payRequestId: id, cancelled: false };
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
		if (!hold)
			throw new HTTPException(ErrorCode.NOT_FOUND, {
				message: 'Hold not found',
			});

		await tx.update(bankingPayRequests).set({ status: 'cancelled', cancelledAt: new Date() }).where(eq(bankingPayRequests.id, req.id));

		await releaseHold({ tx, holdId: hold.id, userId: user.id, reason: `Cancelled pay request ${req.id}` });

		await finalizeReferenceTransactionsFailed({
			tx,
			referenceType: 'pay_request',
			referenceId: req.id,
		});

		return { payRequestId: id, cancelled: true };
	});
}
