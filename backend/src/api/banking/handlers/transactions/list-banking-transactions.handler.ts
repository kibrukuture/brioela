import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingTransactions } from '@schnl/shared/drizzle/schema';
import { and, desc, eq, sql } from '@schnl/shared/drizzle';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import {
	listBankingTransactionsQuerySchema,
	listBankingTransactionsResponseSchema,
} from '@schnl/shared/validators/banking-transaction.validator';
import { bigintToString } from '@schnl/shared/utils/money';
import dayjs from 'dayjs';

export async function listBankingTransactions(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsedQuery = listBankingTransactionsQuerySchema.safeParse({
		limit: c.req.query('limit'),
		cursor: c.req.query('cursor'),
	});
	if (!parsedQuery.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsedQuery.error.issues[0].message });
	}

	const limit = parsedQuery.data.limit ?? 30;
	const cursor = parsedQuery.data.cursor ?? null;
	const cursorDayjs = cursor ? dayjs(cursor) : null;
	if (cursor && (!cursorDayjs || !cursorDayjs.isValid())) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid cursor' });
	}
	const cursorDate = cursorDayjs ? cursorDayjs.toDate() : null;

	const db = getDb();

	const whereClause = cursorDate
		? and(eq(bankingTransactions.userId, user.id), sql`${bankingTransactions.createdAt} < ${cursorDate}`)
		: eq(bankingTransactions.userId, user.id);

	const rows = await db.select().from(bankingTransactions).where(whereClause).orderBy(desc(bankingTransactions.createdAt)).limit(limit);

	const transactions = rows.map((row) => ({
		...row,
		amountAtomic: bigintToString(row.amountAtomic),
		createdAt: dayjs(row.createdAt).toISOString(),
		settledAt: row.settledAt ? dayjs(row.settledAt).toISOString() : null,
		occurredAt: row.occurredAt ? dayjs(row.occurredAt).toISOString() : null,
	}));

	const nextCursor =
		rows.length === limit && rows[rows.length - 1]?.createdAt ? dayjs(rows[rows.length - 1]!.createdAt).toISOString() : null;

	const validation = listBankingTransactionsResponseSchema.safeParse({
		transactions,
		nextCursor,
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
