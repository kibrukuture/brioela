import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingPeerToPeerTransfers } from '@schnl/shared/drizzle/schema';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { createPeerToPeerTransferSchema } from '@schnl/shared/validators/peer-to-peer-transfer.validator';
import dayjs from 'dayjs';
import { createHold } from '@/api/banking/helpers/ledger';
import { BANKING_LEDGER_HOLD_REFERENCE_TYPES } from '@schnl/shared/constants/banking-ledger-hold-reference-types';
import { createQStashClient } from '@/message-queue';
import { publishJob } from '@/message-queue/publish';
import { PRODUCTION_API_BASE_URL } from '@schnl/shared/constants';
import { QUEUE_ROUTES } from '@schnl/shared/api/queue.routes';
import { parseAmountAtomic } from '@schnl/shared/utils/money';
import { createUserActivityTransaction } from '@/api/banking/helpers/transactions/create-user-activity-transaction';

export async function createPeerToPeerTransfer(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = createPeerToPeerTransferSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
	}

	if (parsed.data.recipientUserId === user.id) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Cannot send money to yourself' });
	}

	const db = getDb();
	const expiresAt = dayjs().add(1, 'day').toDate();
	const amountAtomic = parseAmountAtomic(parsed.data.amountAtomic);

	const result = await db.transaction(async (tx) => {
		const [transfer] = await tx
			.insert(bankingPeerToPeerTransfers)
			.values({
				senderUserId: user.id,
				recipientUserId: parsed.data.recipientUserId,
				amountAtomic,
				currency: parsed.data.currency,
				transferPurpose: parsed.data.transferPurpose,
				status: 'created',
			})
			.returning();

		await createHold({
			tx,
			userId: user.id,
			currency: parsed.data.currency,
			amountAtomic: parsed.data.amountAtomic,
			referenceType: BANKING_LEDGER_HOLD_REFERENCE_TYPES.PEER_TO_PEER,
			referenceId: transfer.id,
			expiresAt,
			description: `Hold for peer to peer transfer ${transfer.id}`,
		});

		await createUserActivityTransaction({
			tx,
			userId: user.id,
			type: 'transfer_out',
			direction: 'debit',
			status: 'pending',
			amountAtomic,
			currency: parsed.data.currency,
			rail: null,
			referenceType: 'peer_to_peer',
			referenceId: transfer.id,
			description: 'Peer to peer transfer',
			category: 'transfer',
			createdAt: dayjs().toDate(),
		});

		return { transferId: transfer.id };
	});

	const qstash = createQStashClient();
	await publishJob(qstash, PRODUCTION_API_BASE_URL + QUEUE_ROUTES['banking.peer-to-peer-execute'], {
		type: 'banking.peer_to_peer_execute',
		transferId: result.transferId,
	});

	return { transferId: result.transferId };
}
