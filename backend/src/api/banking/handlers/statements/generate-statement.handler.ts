import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingTransactions } from '@brioela/shared/drizzle/schema';
import { and, desc, eq, sql } from '@brioela/shared/drizzle';
import { ErrorCode } from '@brioela/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { generateStatementRequestSchema } from '@brioela/shared/validators/statement.validator';
import { generateStatementPDF } from '@/api/banking/handlers/statements/templates/statement-document';
import dayjs from 'dayjs';

export async function generateStatement(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsedQuery = generateStatementRequestSchema.safeParse({
		startDate: c.req.query('startDate'),
		endDate: c.req.query('endDate'),
	});
	if (!parsedQuery.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsedQuery.error.issues[0].message });
	}

	const { startDate, endDate } = parsedQuery.data;
	const start = dayjs(startDate);
	const end = dayjs(endDate);

	if (!start.isValid() || !end.isValid()) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid date format' });
	}

	if (start.isAfter(end)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Start date must be before end date' });
	}

	const db = getDb();

	const transactions = await db
		.select()
		.from(bankingTransactions)
		.where(
			and(
				eq(bankingTransactions.userId, user.id),
				sql`${bankingTransactions.createdAt} >= ${start.toDate()} AND ${bankingTransactions.createdAt} <= ${end.toDate()}`
			)
		)
		.orderBy(desc(bankingTransactions.createdAt));

	const pdfBytes = await generateStatementPDF({
		transactions,
		startDate: start.toDate(),
		endDate: end.toDate(),
		user: {
			email: user.email,
		},
	});

	const fileName = `statement-${start.format('YYYY-MM-DD')}-to-${end.format('YYYY-MM-DD')}.pdf`;

	return new Response(pdfBytes, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${fileName}"`,
			'Content-Length': pdfBytes.length.toString(),
		},
	});
}
