import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingOutgoingPayouts } from '@brioela/shared/drizzle/schema';
import { eq } from '@brioela/shared/drizzle';
import { createOutgoingPayoutSchema } from '@brioela/shared/validators/outgoing-payout.validator';
import { encryptWithAES256GCM } from '@/core/crypto/encrypt-with-aes-256-gcm';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { createHold } from '@/api/banking/helpers/ledger/holds';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@brioela/shared/constants/banking-ledger-hold-reference-types';
import dayjs from 'dayjs';
import { createQStashClient } from '@/message-queue';
import { publishJob } from '@/message-queue/publish';
import { PRODUCTION_API_BASE_URL } from '@brioela/shared/constants';
import { QUEUE_ROUTES } from '@brioela/shared/api/queue.routes';
import { requireBankingKycApproved } from '@/api/banking/helpers/outgoing-payouts/require-banking-kyc-approved';
import { createOrGetExternalAccountId } from '@/api/banking/helpers/outgoing-payouts/create-or-get-external-account-id';
import { createOutgoingPayoutRecord } from '@/api/banking/helpers/outgoing-payouts/create-outgoing-payout-record';
import { createUserActivityTransaction } from '@/api/banking/helpers/transactions/create-user-activity-transaction';
import { parseAmountAtomic } from '@brioela/shared/utils/money';

export async function createOutgoingPayout(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = createOutgoingPayoutSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
	}

	const db = getDb();
	const result = await db.transaction(async (tx) => {
		await requireBankingKycApproved({ tx, userId: user.id });

		const expiresAt = dayjs().add(1, 'day').toDate();

		const encryptedDestinationBankDetails = encryptWithAES256GCM(
			JSON.stringify({
				bankDetails: parsed.data.bankDetails,
				recipientFullName: parsed.data.recipientFullName,
			})
		);

		let destinationExternalAccountId: string | null = null;
		if (parsed.data.saveRecipient) {
			destinationExternalAccountId = await createOrGetExternalAccountId({
				tx,
				userId: user.id,
				label: parsed.data.label ?? '',
				recipientFullName: parsed.data.recipientFullName,
				currency: parsed.data.currency,
				bankDetails: parsed.data.bankDetails,
			});
		}

		const payout = await createOutgoingPayoutRecord({
			tx,
			userId: user.id,
			amountAtomic: parsed.data.amountAtomic,
			currency: parsed.data.currency,
			transferPurpose: parsed.data.transferPurpose,
			destinationExternalAccountId,
			encryptedDestinationBankDetails,
		});

		await createHold({
			tx,
			userId: user.id,
			currency: parsed.data.currency,
			amountAtomic: parsed.data.amountAtomic,
			referenceType: BANKING_LEDGER_HOLD_REFERENCE_TYPES.OUTGOING_PAYOUT,
			referenceId: payout.id,
			expiresAt,
			description: `Hold for outgoing payout ${payout.id}`,
		});

		await createUserActivityTransaction({
			tx,
			userId: user.id,
			type: 'withdrawal',
			direction: 'debit',
			status: 'pending',
			amountAtomic: parseAmountAtomic(parsed.data.amountAtomic),
			currency: parsed.data.currency,
			rail: null,
			referenceType: 'outgoing_payout',
			referenceId: payout.id,
			description: 'Outgoing payout',
			category: 'withdrawal',
			createdAt: dayjs().toDate(),
		});

		return { payoutId: payout.id };
	});

	const qstash = createQStashClient();
	await publishJob(qstash, PRODUCTION_API_BASE_URL + QUEUE_ROUTES['banking.outgoing-payout-execute'], {
		type: 'banking.outgoing_payout_execute',
		payoutId: result.payoutId,
		transferPurpose: parsed.data.transferPurpose,
	});

	const [payout] = await db
		.select({
			id: bankingOutgoingPayouts.id,
			userId: bankingOutgoingPayouts.userId,
			amountAtomic: bankingOutgoingPayouts.amountAtomic,
			currency: bankingOutgoingPayouts.currency,
			status: bankingOutgoingPayouts.status,
			destinationExternalAccountId: bankingOutgoingPayouts.destinationExternalAccountId,
			providerTransferId: bankingOutgoingPayouts.providerTransferId,
			createdAt: bankingOutgoingPayouts.createdAt,
			updatedAt: bankingOutgoingPayouts.updatedAt,
		})
		.from(bankingOutgoingPayouts)
		.where(eq(bankingOutgoingPayouts.id, result.payoutId))
		.limit(1);

	if (!payout) throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Failed to create payout' });

	return {
		payout: {
			id: payout.id,
			userId: payout.userId,
			amountAtomic: payout.amountAtomic.toString(),
			currency: payout.currency,
			status: payout.status,
			destinationExternalAccountId: payout.destinationExternalAccountId,
			providerTransferId: payout.providerTransferId,
			createdAt: payout.createdAt.toISOString(),
			updatedAt: payout.updatedAt.toISOString(),
		},
	};
}
