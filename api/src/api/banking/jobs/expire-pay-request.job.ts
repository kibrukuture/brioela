import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import dayjs from 'dayjs';
import { and, eq } from '@schnl/shared/drizzle';
import { bankingLedgerHolds, bankingPayRequests } from '@schnl/shared/drizzle/schema';
import { releaseHold } from '@/api/banking/helpers/ledger';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { expirePayRequestJobPayloadSchema } from '@schnl/shared/validators/pay-request.validator';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';

export async function expirePayRequestJob(c: AppContext) {
	const body = await c.req.json();
	const parsed = expirePayRequestJobPayloadSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, {
			message: parsed.error.issues[0]?.message ?? 'Invalid payload',
		});
	}
	const payload = parsed.data;

	const db = getDb();
	await db.transaction(async (tx) => {
		const [req] = await tx.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, payload.payRequestId)).limit(1);
		if (!req) return;

		if (req.status !== 'waiting_for_claim') return;
		if (dayjs(req.expiresAt).isAfter(dayjs())) return;

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

		await tx.update(bankingPayRequests).set({ status: 'expired' }).where(eq(bankingPayRequests.id, req.id));

		if (hold.status === 'active') {
			await releaseHold({ tx, holdId: hold.id, userId: req.senderUserId, reason: `Expired pay request ${req.id}` });
		}
	});

	return c.json({ success: true });
}
