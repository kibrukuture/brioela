import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { createBankingRecipientSchema, createBankingRecipientResponseSchema } from '@brioela/shared/validators/banking-recipient.validator';
import { requireBankingKycApproved } from '@/api/banking/helpers/outgoing-payouts/require-banking-kyc-approved';
import { createOrGetExternalAccountId } from '@/api/banking/helpers/outgoing-payouts/create-or-get-external-account-id';

export async function createBankingRecipient(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = createBankingRecipientSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: parsed.error.issues[0]?.message ?? 'Invalid input',
		});
	}

	const db = getDb();
	await db.transaction(async (tx) => {
		await requireBankingKycApproved({ tx, userId: user.id });

		await createOrGetExternalAccountId({
			tx,
			userId: user.id,
			label: parsed.data.label,
			recipientFullName: parsed.data.recipientFullName,
			currency: parsed.data.currency,
			bankDetails: parsed.data.bankDetails,
		});
	});

	const validation = createBankingRecipientResponseSchema.safeParse({ ok: true });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, {
			message: validation.error.issues[0]?.message ?? 'Internal error',
		});
	}

	return validation.data;
}
