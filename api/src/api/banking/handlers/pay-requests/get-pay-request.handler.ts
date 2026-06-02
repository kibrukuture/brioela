import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingPayRequests } from '@schnl/shared/drizzle/schema';
import { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { payRequestIdParamSchema } from '@schnl/shared/validators/pay-request.validator';
import { bigintToString } from '@schnl/shared/utils/money';

export async function getPayRequest(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	const idParsed = payRequestIdParamSchema.safeParse({ id: c.req.param('id') });
	if (!idParsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: idParsed.error.issues[0]?.message ?? 'Invalid pay request id',
		});
	}
	const id = idParsed.data.id;

	const db = getDb();
	const [dbUser] = await db.select({ email: users.email }).from(users).where(eq(users.id, user.id)).limit(1);
	if (!dbUser?.email) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'User not found' });
	const [row] = await db.select().from(bankingPayRequests).where(eq(bankingPayRequests.id, id)).limit(1);
	if (!row) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Pay request not found' });
	const [sender] = await db
		.select({ firstName: users.firstName, lastName: users.lastName })
		.from(users)
		.where(eq(users.id, row.senderUserId))
		.limit(1);
	const isSender = row.senderUserId === user.id;
	const isRecipient = row.recipientEmail.toLowerCase() === dbUser.email.toLowerCase();
	if (!isSender && !isRecipient)
		throw new HTTPException(
			ErrorCode.PRECONDITION_FAILED,
			//
			{ message: 'You are not the sender or recipient of this pay request' }
		);
	return {
		payRequest: {
			...row,
			amountAtomic: bigintToString(row.amountAtomic),
			senderFirstName: sender?.firstName ?? null,
			senderLastName: sender?.lastName ?? null,
		},
	};
}
