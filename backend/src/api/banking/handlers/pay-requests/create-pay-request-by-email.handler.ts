import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { users } from '@brioela/shared/drizzle/schema/user.schema';
import { bankingPayRequests, challenges } from '@brioela/shared/drizzle/schema';
import { eq } from '@brioela/shared/drizzle';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { sha256Hex } from '@/core/crypto/sha256';
import getResendClient from '@/core/clients/resend';
import PayRequestClaimTemplate from '@/core/email/templates/pay-request-claim.template';
import { renderToString } from 'hono/jsx/dom/server';
import { createPayRequestByEmailSchema } from '@brioela/shared/validators/pay-request.validator';
import { createHold } from '@/api/banking/helpers/ledger';
import { createQStashClient } from '@/message-queue';
import { publishJob } from '@/message-queue/publish';
import { PRODUCTION_API_BASE_URL } from '@brioela/shared/constants';
import { QUEUE_ROUTES } from '@brioela/shared/api/queue.routes';
import { ErrorCode } from '@brioela/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { atomicToDecimalString } from '@brioela/shared/utils/money';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { BANKING_PAY_REQUEST_CLAIM_CHALLENGE } from '@brioela/shared/constants/banking-pay-request-claim-challenge';
import { EMAIL_FROM } from '@brioela/shared/constants';
import { createUserActivityTransaction } from '@/api/banking/helpers/transactions/create-user-activity-transaction';
export async function createPayRequestByEmail(c: AppContext) {
	const user = c.get('user');
	if (!user)
		throw new HTTPException(ErrorCode.UNAUTHORIZED, {
			message: 'Unauthorized',
		});
	const body = await c.req.json();
	const parsed = createPayRequestByEmailSchema.safeParse(body);
	if (!parsed.success)
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: parsed.error.issues[0]?.message ?? 'Invalid input',
		});

	const db = getDb();
	const [dbUser] = await db
		.select({ email: users.email, firstName: users.firstName, lastName: users.lastName, bankingKycStatus: users.bankingKycStatus })
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

	const expiresAt = dayjs().add(BANKING_PAY_REQUEST_CLAIM_CHALLENGE.EXPIRES_IN_DAYS, 'day').toDate();

	const created = await db.transaction(async (tx) => {
		const [payRequest] = await tx
			.insert(bankingPayRequests)
			.values({
				senderUserId: user.id,
				recipientEmail: parsed.data.recipientEmail,
				recipientName: parsed.data.recipientName,
				amountAtomic: BigInt(parsed.data.amountAtomic),
				sourceCurrency: parsed.data.sourceCurrency,
				payoutCurrency: parsed.data.payoutCurrency,
				status: 'waiting_for_claim',
				expiresAt,
			})
			.returning();

		const rawToken = nanoid(40);
		const tokenHash = await sha256Hex(rawToken);
		await tx.insert(challenges).values({
			purpose: BANKING_PAY_REQUEST_CLAIM_CHALLENGE.PURPOSE,
			subjectType: BANKING_PAY_REQUEST_CLAIM_CHALLENGE.SUBJECT_TYPE,
			subjectId: payRequest.id,
			userId: user.id,
			tokenHash,
			expiresAt,
			maxAttempts: 20,
		});

		// ledger hold for sender
		await createHold({
			tx,
			userId: user.id,
			currency: parsed.data.sourceCurrency,
			amountAtomic: parsed.data.amountAtomic,
			referenceType: BANKING_LEDGER_HOLD_REFERENCE_TYPES.PAY_REQUEST,
			referenceId: payRequest.id,
			expiresAt,
			description: `Hold for pay-by-email request ${payRequest.id}`,
		});

		await createUserActivityTransaction({
			tx,
			userId: user.id,
			type: 'transfer_out',
			direction: 'debit',
			status: 'pending',
			amountAtomic: BigInt(parsed.data.amountAtomic),
			currency: parsed.data.sourceCurrency,
			rail: null,
			referenceType: 'pay_request',
			referenceId: payRequest.id,
			description: 'Pay request',
			category: 'transfer',
			createdAt: dayjs().toDate(),
		});

		return { payRequest, rawToken };
	});

	const qstash = createQStashClient();
	const delaySeconds = Math.max(0, dayjs(expiresAt).diff(dayjs(), 'second'));
	await publishJob(
		qstash,
		PRODUCTION_API_BASE_URL + QUEUE_ROUTES['banking.pay-request-expire'],
		{ type: 'banking.pay_request_expire', payRequestId: created.payRequest.id },
		{ delay: delaySeconds, retries: 3 }
	);

	const senderName = `${dbUser.firstName ?? ''} ${dbUser.lastName ?? ''}`.trim() || dbUser.email;
	// const deepLink = `com.schnl.app://pay/claim?token=${encodeURIComponent(created.rawToken)}`;

	const deepLink = `https://schnl.com/pay/claim?token=${encodeURIComponent(created.rawToken)}`;

	const amountDecimalText = atomicToDecimalString(BigInt(parsed.data.amountAtomic), parsed.data.sourceCurrency);
	const amountText = `${amountDecimalText} ${String(parsed.data.sourceCurrency).toUpperCase()}`;
	const html = renderToString(
		PayRequestClaimTemplate({
			senderName,
			amountText,
			deepLink,
			expiresInDays: BANKING_PAY_REQUEST_CLAIM_CHALLENGE.EXPIRES_IN_DAYS,
		})
	);
	const resendClient = getResendClient();
	const emailResult = await resendClient.emails.send({
		to: parsed.data.recipientEmail,
		subject: `${senderName} sent you ${amountText}`,
		html,
		from: EMAIL_FROM.generic,
	});
	if (emailResult.error) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, {
			message: 'Failed to send recipient email',
		});
	}

	return {
		payRequest: {
			id: created.payRequest.id,
			status: created.payRequest.status,
			expiresAt: created.payRequest.expiresAt,
		},
	};
}
