import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingExternalAccounts } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { ErrorCode } from '@brioela/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { bankingRecipientIdParamSchema, getBankingRecipientResponseSchema } from '@brioela/shared/validators/banking-recipient.validator';
import dayjs from 'dayjs';

export async function getBankingRecipient(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsed = bankingRecipientIdParamSchema.safeParse({ id: c.req.param('id') });
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0].message });
	}

	const db = getDb();
	const [recipient] = await db
		.select()
		.from(bankingExternalAccounts)
		.where(and(eq(bankingExternalAccounts.userId, user.id), eq(bankingExternalAccounts.id, parsed.data.id)))
		.limit(1);

	if (!recipient) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Recipient not found' });

	const recipientUi = {
		...recipient,
		createdAt: dayjs(recipient.createdAt).toISOString(),
	};

	const validation = getBankingRecipientResponseSchema.safeParse({ recipient: recipientUi });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
