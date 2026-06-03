import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingTransactions } from '@brioela/shared/drizzle/schema';
import { eq, and } from '@brioela/shared/drizzle';
import { ErrorCode } from '@brioela/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import {
	setBankingTransactionCategoryInputSchema,
	setBankingTransactionCategoryResponseSchema,
	bankingTransactionIdParamSchema,
} from '@brioela/shared/validators/banking-transaction-category-api.validator';

export async function setBankingTransactionCategory(c: AppContext) {
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
	const parsed = setBankingTransactionCategoryInputSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0].message });
	}

	const db = getDb();
	const [updated] = await db
		.update(bankingTransactions)
		.set({
			category: parsed.data.category,
		})
		.where(and(eq(bankingTransactions.id, transactionId), eq(bankingTransactions.userId, user.id)))
		.returning({ id: bankingTransactions.id });

	if (!updated) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Transaction not found' });

	const validation = setBankingTransactionCategoryResponseSchema.safeParse({ ok: true });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}
	return validation.data;
}
