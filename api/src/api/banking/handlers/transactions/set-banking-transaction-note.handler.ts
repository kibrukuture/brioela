import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingTransactions } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import {
	setBankingTransactionNoteInputSchema,
	setBankingTransactionNoteResponseSchema,
	bankingTransactionIdParamSchema,
} from '@schnl/shared/validators/banking-transaction-note-api.validator';

export async function setBankingTransactionNote(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsedParams = bankingTransactionIdParamSchema.safeParse({
		id: c.req.param('id'),
	});
	if (!parsedParams.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsedParams.error.issues[0].message });
	}

	const transactionId = parsedParams.data.id;

	const body = await c.req.json();
	const parsed = setBankingTransactionNoteInputSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0].message });
	}

	const db = getDb();
	const [updated] = await db
		.update(bankingTransactions)
		.set({
			note: parsed.data.note,
		})
		.where(and(eq(bankingTransactions.id, transactionId), eq(bankingTransactions.userId, user.id)))
		.returning({ id: bankingTransactions.id });

	if (!updated) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Transaction not found' });

	const validation = setBankingTransactionNoteResponseSchema.safeParse({ ok: true });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}
	return validation.data;
}
