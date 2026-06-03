import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { bankingPayRequests, challenges } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import dayjs from 'dayjs';
import { sha256Hex } from '@/core/crypto/sha256';
import { claimPayRequestSchema } from '@schnl/shared/validators/pay-request.validator';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { BANKING_PAY_REQUEST_CLAIM_CHALLENGE } from '@schnl/shared/constants/banking-pay-request-claim-challenge';

export async function claimPayRequest(c: AppContext) {
	const user = c.get('user');
	if (!user)
		throw new HTTPException(ErrorCode.UNAUTHORIZED, {
			message: 'Unauthorized',
		});
	const body = await c.req.json();
	const parsed = claimPayRequestSchema.safeParse(body);
	if (!parsed.success)
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: parsed.error.issues[0]?.message ?? 'Invalid input',
		});

	const db = getDb();
	const [dbUser] = await db
		.select({ email: users.email, bankingKycStatus: users.bankingKycStatus })
		.from(users)
		.where(eq(users.id, user.id))
		.limit(1);
	if (!dbUser?.email)
		throw new HTTPException(ErrorCode.NOT_FOUND, {
			message: 'User not found',
		});
	if (dbUser.bankingKycStatus !== 'approved') {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: 'Identity verification required. Please complete KYC first.',
		});
	}

	const tokenHash = await sha256Hex(parsed.data.token);

	return db.transaction(async (tx) => {
		const [challenge] = await tx
			.select()
			.from(challenges)
			.where(
				and(
					eq(challenges.purpose, BANKING_PAY_REQUEST_CLAIM_CHALLENGE.PURPOSE),
					eq(challenges.subjectType, BANKING_PAY_REQUEST_CLAIM_CHALLENGE.SUBJECT_TYPE),
					eq(challenges.tokenHash, tokenHash)
				)
			)
			.limit(1);
		if (!challenge) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Invalid or expired link' });
		if (challenge.usedAt && challenge.consumedByUserId !== user.id)
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'This link has already been used' });
		if (dayjs(challenge.expiresAt).isBefore(dayjs()))
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'This link has expired' });

		const [payRequest] = await tx.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, challenge.subjectId)).limit(1);
		if (!payRequest) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Pay request not found' });
		if (payRequest.status !== 'waiting_for_claim') {
			return { payRequestId: payRequest.id, claimed: false };
		}
		if (dayjs(payRequest.expiresAt).isBefore(dayjs()))
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'This request has expired' });
		if (payRequest.recipientEmail.toLowerCase() !== dbUser.email.toLowerCase())
			throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'This link was sent to a different email' });

		if (!challenge.usedAt) {
			await tx.update(challenges).set({ usedAt: new Date(), consumedByUserId: user.id }).where(eq(challenges.id, challenge.id));
		}
		await tx.update(bankingPayRequests).set({ status: 'claimed', claimedAt: new Date() }).where(eq(bankingPayRequests.id, payRequest.id));

		return { payRequestId: payRequest.id, claimed: true };
	});
}
