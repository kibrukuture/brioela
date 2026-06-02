import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingPayRequests, bankingLedgerHolds } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { submitPayRequestPayoutDetailsSchema } from '@schnl/shared/validators/pay-request.validator';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { encryptWithAES256GCM } from '@/core/crypto/encrypt-with-aes-256-gcm';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { payRequestIdParamSchema } from '@schnl/shared/validators/pay-request.validator';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';
import dayjs from 'dayjs';
import { createQStashClient } from '@/message-queue';
import { publishJob } from '@/message-queue/publish';
import { PRODUCTION_API_BASE_URL } from '@schnl/shared/constants';
import { QUEUE_ROUTES } from '@schnl/shared/api/queue.routes';

export async function submitPayRequestPayoutDetails(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	const idParsed = payRequestIdParamSchema.safeParse({ id: c.req.param('id') });
	if (!idParsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: idParsed.error.issues[0]?.message ?? 'Invalid pay request id',
		});
	}
	const id = idParsed.data.id;

	const body = await c.req.json();
	const parsed = submitPayRequestPayoutDetailsSchema.safeParse(body);
	if (!parsed.success) throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });

	const db = getDb();

	const result = await db.transaction(async (tx) => {
		const [dbUser] = await tx.select({ email: users.email }).from(users).where(eq(users.id, user.id)).limit(1);
		if (!dbUser?.email) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'User not found' });

		const [req] = await tx.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, id)).limit(1);
		if (!req) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Pay request not found' });
		if (req.recipientEmail.toLowerCase() !== dbUser.email.toLowerCase()) {
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Forbidden' });
		}

		if (req.payoutDetailsSubmittedAt || req.status === 'processing' || req.status === 'completed') {
			return { payRequestId: req.id, submitted: true, shouldEnqueue: false };
		}
		if (req.status !== 'claimed') throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Pay request not ready' });

		const expectedType = (() => {
			switch (req.sourceCurrency) {
				case 'usd':
					return 'ach' as const;
				case 'eur':
					return 'iban_sepa' as const;
				case 'aed':
					return 'iban_single' as const;
				default:
					throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
						message: 'Unsupported pay request currency',
					});
			}
		})();

		if (parsed.data.bankDetails.type !== expectedType) {
			throw new HTTPException(ErrorCode.INVALID_INPUT, {
				message: 'Invalid payout details for this pay request currency',
			});
		}

		const encryptedPayoutDetails = encryptWithAES256GCM(JSON.stringify(parsed.data.bankDetails));

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
		if (hold.status !== 'active') throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Hold is not active' });

		await tx
			.update(bankingPayRequests)
			.set({
				status: 'processing',
				encryptedPayoutDetails,
				transferPurpose: parsed.data.transferPurpose,
				payoutDetailsSubmittedAt: dayjs().toDate(),
			})
			.where(eq(bankingPayRequests.id, req.id));

		return { payRequestId: req.id, submitted: true, shouldEnqueue: true };
	});

	if (result.shouldEnqueue) {
		const qstash = createQStashClient();
		await publishJob(qstash, PRODUCTION_API_BASE_URL + QUEUE_ROUTES['banking.pay-request-execute-payout'], {
			type: 'banking.pay_request_execute_payout',
			payRequestId: result.payRequestId,
		});
	}

	return { payRequestId: result.payRequestId, submitted: true };
}
