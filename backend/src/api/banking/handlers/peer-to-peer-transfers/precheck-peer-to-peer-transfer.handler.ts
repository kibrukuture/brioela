import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingVirtualAccounts } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import {
	peerToPeerPrecheckSchema,
	type PeerToPeerPrecheckInput,
	type PeerToPeerPrecheckResponse,
} from '@brioela/shared/validators/peer-to-peer-precheck.validator';
import { users } from '@brioela/shared/drizzle/schema/user.schema';

export async function precheckPeerToPeerTransfer(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const body = await c.req.json();
	const parsed = peerToPeerPrecheckSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: parsed.error.issues[0]?.message ?? 'Invalid input',
		});
	}

	const input: PeerToPeerPrecheckInput = parsed.data;

	if (input.recipientUserId === user.id) {
		const response: PeerToPeerPrecheckResponse = {
			ok: false,
			issues: [{ code: 'recipient_self', message: 'Cannot send money to yourself' }],
		};
		return response;
	}

	const db = getDb();
	const [recipient] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.recipientUserId)).limit(1);
	if (!recipient?.id) {
		const response: PeerToPeerPrecheckResponse = {
			ok: false,
			issues: [{ code: 'recipient_not_found', message: 'Recipient not found' }],
		};
		return response;
	}

	const [virtualAccount] = await db
		.select({ id: bankingVirtualAccounts.id })
		.from(bankingVirtualAccounts)
		.where(and(eq(bankingVirtualAccounts.userId, input.recipientUserId), eq(bankingVirtualAccounts.currency, input.currency)))
		.limit(1);

	if (!virtualAccount?.id) {
		const response: PeerToPeerPrecheckResponse = {
			ok: false,
			issues: [
				{
					code: 'recipient_missing_virtual_account',
					message: 'Recipient bank account missing for selected currency',
				},
			],
		};
		return response;
	}

	const response: PeerToPeerPrecheckResponse = { ok: true, issues: [] };
	return response;
}
