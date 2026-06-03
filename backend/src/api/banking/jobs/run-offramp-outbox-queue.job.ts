import { AppContext } from '@/index';
import dayjs from 'dayjs';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';
import { runOfframpOutboxQueueJobSchema } from '@schnl/shared/validators/offramp-outbox.validator';
import { getOfframpOutboxById } from '@/api/banking/helpers/offramp-outbox/get-offramp-outbox-by-id';
import { getOfframpOutboxRetryDelayMs } from '@/api/banking/helpers/offramp-outbox/get-offramp-outbox-retry-delay-ms';
import { claimOfframpOutbox } from '@/api/banking/helpers/offramp-outbox/claim-offramp-outbox';
import { markOfframpOutboxDone } from '@/api/banking/helpers/offramp-outbox/mark-offramp-outbox-done';
import { markOfframpOutboxFailed } from '@/api/banking/helpers/offramp-outbox/mark-offramp-outbox-failed';
import { publishOfframpOutboxRetry } from '@/api/banking/helpers/offramp-outbox/publish-offramp-outbox-retry';
import { executeOutgoingPayoutOfframp } from '@/api/banking/helpers/offramp-outbox/outgoing-payouts/execute-outgoing-payout-offramp';
import { executePeerToPeerOfframp } from '@/api/banking/helpers/offramp-outbox/peer-to-peer-transfers/execute-peer-to-peer-offramp';
import { executePayRequestOfframp } from '@/api/banking/helpers/offramp-outbox/pay-requests/execute-pay-request-offramp';
import { executeCardOrderOfframp } from '@/api/banking/helpers/offramp-outbox/card-orders/execute-card-order-offramp';

export async function runOfframpOutboxQueueJob(c: AppContext) {
	const body = await c.req.json();
	const parsed = runOfframpOutboxQueueJobSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.BAD_REQUEST, {
			message: parsed.error.issues[0]?.message ?? 'Invalid payload',
		});
	}

	const outboxId = parsed.data.outboxId;
	const initialRow = await getOfframpOutboxById(outboxId);
	if (!initialRow) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: `Offramp outbox ${outboxId} not found` });
	}

	if (initialRow.status === 'done') {
		return c.json({ success: true });
	}

	const now = dayjs();
	if (dayjs(initialRow.nextRunAt).isAfter(now)) {
		return c.json({ success: true });
	}

	const nextAttempt = initialRow.attempt + 1;
	if (nextAttempt > initialRow.maxAttempts) {
		await markOfframpOutboxFailed({
			outboxId: initialRow.id,
			attempt: nextAttempt,
			retryDelayMs: 0,
			error: 'Max attempts reached',
		});
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Max offramp outbox attempts reached' });
	}

	const claim = await claimOfframpOutbox({ outboxId: initialRow.id, lockedBy: c.req.url });
	if (!claim.claimed || !claim.row) {
		return c.json({ success: true });
	}

	const outbox = claim.row;

	try {
		switch (outbox.referenceType) {
			case 'outgoing_payout': {
				await executeOutgoingPayoutOfframp({ payoutId: outbox.referenceId, payload: outbox.payload });
				break;
			}
			case 'peer_to_peer': {
				await executePeerToPeerOfframp({ transferId: outbox.referenceId, payload: outbox.payload });
				break;
			}
			case 'pay_request': {
				await executePayRequestOfframp({ payRequestId: outbox.referenceId, payload: outbox.payload });
				break;
			}
			case 'card_order': {
				await executeCardOrderOfframp({ orderId: outbox.referenceId, payload: outbox.payload });
				break;
			}
			default: {
				throw new HTTPException(ErrorCode.BAD_REQUEST, { message: `Unsupported referenceType: ${outbox.referenceType}` });
			}
		}
	} catch (error) {
		const retryDelayMs = getOfframpOutboxRetryDelayMs(Math.max(0, nextAttempt - 1));
		await markOfframpOutboxFailed({
			outboxId: outbox.id,
			attempt: nextAttempt,
			retryDelayMs,
			error: error instanceof HTTPException ? error.message : error instanceof Error ? error.message : 'Unknown error',
		});
		await publishOfframpOutboxRetry({ outboxId: outbox.id, retryDelayMs });
		return c.json({ success: true });
	}

	await markOfframpOutboxDone({ outboxId: outbox.id });
	return c.json({ success: true });
}
