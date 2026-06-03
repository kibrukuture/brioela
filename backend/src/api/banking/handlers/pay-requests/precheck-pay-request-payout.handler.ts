import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import {
	payRequestPayoutPrecheckParamsSchema,
	payRequestPayoutPrecheckSchema,
	type PayRequestPayoutPrecheckInput,
	type PayRequestPayoutPrecheckResponse,
} from '@brioela/shared/validators/pay-request-precheck.validator';
import { bankingLedgerHolds, bankingPayRequests } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { users } from '@brioela/shared/drizzle/schema/user.schema';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import { getBankDetailsTypeForCurrency } from '@brioela/shared/lib/banking/payments/get-bank-details-type-for-currency';

export async function precheckPayRequestPayout(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const idParsed = payRequestPayoutPrecheckParamsSchema.safeParse({
		id: c.req.param('id'),
	});
	if (!idParsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: idParsed.error.issues[0]?.message ?? 'Invalid pay request id',
		});
	}

	const body = await c.req.json();
	const parsed = payRequestPayoutPrecheckSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: parsed.error.issues[0]?.message ?? 'Invalid input',
		});
	}

	const input: PayRequestPayoutPrecheckInput = parsed.data;

	const db = getDb();

	const [dbUser] = await db.select({ email: users.email }).from(users).where(eq(users.id, user.id)).limit(1);
	if (!dbUser?.email) {
		const response: PayRequestPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'user_not_found', message: 'User not found' }],
		};
		return response;
	}

	const [req] = await db.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, idParsed.data.id)).limit(1);
	if (!req) {
		const response: PayRequestPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'pay_request_not_found', message: 'Pay request not found' }],
		};
		return response;
	}

	if (req.recipientEmail.toLowerCase() !== dbUser.email.toLowerCase()) {
		const response: PayRequestPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'forbidden', message: 'Forbidden' }],
		};
		return response;
	}

	if (req.status !== 'claimed') {
		const response: PayRequestPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'not_ready', message: 'Pay request not ready' }],
		};
		return response;
	}

	const expectedType = getBankDetailsTypeForCurrency(req.sourceCurrency);

	if (!expectedType) {
		const response: PayRequestPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'unsupported_currency', message: 'Unsupported pay request currency' }],
		};
		return response;
	}

	if (input.bankDetails.type !== expectedType) {
		const response: PayRequestPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'invalid_bank_details', message: 'Invalid payout details for this pay request currency' }],
		};
		return response;
	}

	const [hold] = await db
		.select({ id: bankingLedgerHolds.id, status: bankingLedgerHolds.status })
		.from(bankingLedgerHolds)
		.where(
			and(eq(bankingLedgerHolds.referenceType, BANKING_LEDGER_HOLD_REFERENCE_TYPES.PAY_REQUEST), eq(bankingLedgerHolds.referenceId, req.id))
		)
		.limit(1);

	if (!hold?.id) {
		const response: PayRequestPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'hold_not_found', message: 'Hold not found' }],
		};
		return response;
	}

	if (hold.status !== 'active') {
		const response: PayRequestPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'hold_inactive', message: 'Hold is not active' }],
		};
		return response;
	}

	const response: PayRequestPayoutPrecheckResponse = { ok: true, issues: [] };
	return response;
}
