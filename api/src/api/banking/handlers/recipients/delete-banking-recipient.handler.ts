import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingExternalAccounts } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { bankingRecipientIdParamSchema, deleteBankingRecipientResponseSchema } from '@schnl/shared/validators/banking-recipient.validator';

export async function deleteBankingRecipient(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsed = bankingRecipientIdParamSchema.safeParse({ id: c.req.param('id') });
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0].message });
	}

	const db = getDb();
	const deleted = await db
		.delete(bankingExternalAccounts)
		.where(and(eq(bankingExternalAccounts.userId, user.id), eq(bankingExternalAccounts.id, parsed.data.id)))
		.returning({ id: bankingExternalAccounts.id });

	if (deleted.length === 0) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Recipient not found' });
	}

	const validation = deleteBankingRecipientResponseSchema.safeParse({ ok: true });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
