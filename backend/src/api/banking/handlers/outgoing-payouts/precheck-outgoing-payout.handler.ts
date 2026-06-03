import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import {
	outgoingPayoutPrecheckSchema,
	type OutgoingPayoutPrecheckInput,
	type OutgoingPayoutPrecheckResponse,
} from '@schnl/shared/validators/outgoing-payout-precheck.validator';
import { requireBankingKycApproved } from '@/api/banking/helpers/outgoing-payouts/require-banking-kyc-approved';
import { getBankDetailsTypeForCurrency } from '@schnl/shared/lib/banking/payments/get-bank-details-type-for-currency';

export async function precheckOutgoingPayout(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = outgoingPayoutPrecheckSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: parsed.error.issues[0]?.message ?? 'Invalid input',
		});
	}

	const input: OutgoingPayoutPrecheckInput = parsed.data;

	const expectedType = getBankDetailsTypeForCurrency(input.currency);

	if (!expectedType) {
		const response: OutgoingPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'unsupported_currency', message: 'Unsupported payout currency' }],
		};
		return response;
	}

	if (input.bankDetails.type !== expectedType) {
		const response: OutgoingPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'invalid_bank_details', message: 'Invalid bank details for selected currency' }],
		};
		return response;
	}

	const db = getDb();
	try {
		await db.transaction(async (tx) => {
			await requireBankingKycApproved({ tx, userId: user.id });
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : 'Sender is not ready for payout';
		const response: OutgoingPayoutPrecheckResponse = {
			ok: false,
			issues: [{ code: 'sender_not_ready', message }],
		};
		return response;
	}

	const response: OutgoingPayoutPrecheckResponse = { ok: true, issues: [] };
	return response;
}
